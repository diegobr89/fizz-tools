import FizzTools from '../fizz-tools';
import { ExtensionStorage } from '../extension-storage';
import { VscodeStorage } from '../vscode-storage';
import { promises as fsPromises } from 'fs';
import * as vscode from 'vscode';
import * as yaml from 'yaml';
import * as childProcess from 'child_process';

const DEBUG_MODE_KEY = 'debugMode';

interface NecessaryFiles {
	sls: any,
	docker: any,
	packageJson: any
}

interface VscodeLaunchConfigItem {
	type: string,
	request: string,
	name: string,
	remoteRoot: string,
	preLaunchTask: string
}

interface VscodeTasksItem {
	label: string,
	command: string,
	args: Array<string>,
	type: string
}

export default class ToggleSlsDebug extends FizzTools {

	storage = new ExtensionStorage('toggle-sls-debug');

	subscribe() {
		super.subscribe('extension.toggle-sls-debug');
	}

	async onRun() {

		const necessaryFiles = await this._getNecessaryFiles();

		if(!this._isValidSlsWorkspace(necessaryFiles))
			throw 'Invalid janis sls workspace';

		if(!this._isDockerExtInstalled())
			throw 'Docker extension must be installed';

		const debugMode = await this.storage.getKey(DEBUG_MODE_KEY);
		const toggleState = !debugMode;

		await this._modifyPackageJson(necessaryFiles, toggleState);
		await this._modifyDockerCompose(necessaryFiles, toggleState);
		await this._modifyLaunchJson(toggleState);
		await this._modifyTasksJson(toggleState);

		if(toggleState)
			await this._startDebugging();
		else
			await vscode.window.showInformationMessage('SlS debug disabled!');

		return true;
	}

	_backupFiles() {

	}

	async _modifyDockerCompose(necFiles: NecessaryFiles, setDebugOn: boolean) {
		const data = await fsPromises.readFile(necFiles.docker.fsPath);
		const fileContent = data.toString();
		const yamlJson = yaml.parse(fileContent);

		if(setDebugOn){
			yamlJson.services.janis.ports.push('9229:9229');
			yamlJson.services.janis.environment.push('SLS_DEBUG=*');
		}
		else{
			yamlJson.services.janis.ports =
				yamlJson.services.janis.ports.filter((port: string) => port !== '9229:9229');
			yamlJson.services.janis.environment =
				yamlJson.services.janis.environment.filter((environment: string) => environment !== 'SLS_DEBUG=*');
		}

		const moddedYaml = yaml.stringify(yamlJson);
		await fsPromises.writeFile(necFiles.docker.fsPath, moddedYaml);
		await this.storage.setKey(DEBUG_MODE_KEY, setDebugOn);
		return true;
	}

	async _modifyPackageJson(necFiles: NecessaryFiles, setDebugOn: boolean) {
		const data = await fsPromises.readFile(necFiles.packageJson.fsPath);
		const fileContent = data.toString();
		const pkgJson = JSON.parse(fileContent);
		if(setDebugOn)
			pkgJson.scripts.start = 'node --inspect=0.0.0.0:9229 ./node_modules/.bin/sls offline';
		else
			pkgJson.scripts.start = 'sls offline';
		const moddedPkgJson = JSON.stringify(pkgJson,null,'  ');
		await fsPromises.writeFile(necFiles.packageJson.fsPath, moddedPkgJson);
		await this.storage.setKey(DEBUG_MODE_KEY, setDebugOn);
		return true;
	}

	async _modifyLaunchJson(setDebugOn: boolean) {
		const launchFile = new VscodeStorage('launch.json');
		let config = <Array<VscodeLaunchConfigItem>> await launchFile.getKey('configurations');

		if(!config || !Array.isArray(config))
			config = [];

		const alreadyExistsConfig = config.find(item => item.type === 'node' && item.request === 'attach');
		if(alreadyExistsConfig)
			return true;

		config.push({
			type: "node",
			request: "attach",
			name: "Docker: Attach to Node",
			remoteRoot: "/var/www/janis",
			preLaunchTask: "docker_restart"
		});

		await launchFile.setKey('configurations',config);
		return true;
	}

	async _modifyTasksJson(setDebugOn: boolean) {
		const tasksFile = new VscodeStorage('tasks.json');
		let config = <Array<VscodeTasksItem>> await tasksFile.getKey('tasks');

		if(!config || !Array.isArray(config))
			config = [];

		const alreadyExistsTask = config.find(item => item.label === 'docker_restart');
		if(alreadyExistsTask)
			return true;

		config.push({
			label: "docker_restart",
			command: "docker-compose down && docker-compose up -d",
			args: [],
			type: "shell"
		});
		await tasksFile.setKey('tasks',config);
		return true;
	}

	// _shellExec(command: string): Promise<any> {
	// 	const promise = (resolve: any, reject: any) => {
	// 		childProcess.exec(command,{ cwd: vscode.workspace.rootPath }, (err, stdout, stderr) => {
	// 			if (err) return reject(err)
	// 			if (stderr) return reject(stderr)
	// 			return resolve(stdout)
	// 		});
	// 	}

	// 	return new Promise(promise);
	// }

	// async _restartDocker() {
	// 	const rgx = /(?<=[\n\r]).*(?<=^[^-])(.*?)(?=\s)/gm;
	// 	const composeResult = await this._shellExec('docker-compose ps')
	// 	const splitted = composeResult.split('\n');
	// 	const services = splitted.slice(2,splitted.length).filter((element: string) => element);
	// 	for(let i = 0; i < services.length; i++){
	// 		const item = services[i].substr(0,services[i].indexOf(' '));
	// 		await this._shellExec(`docker restart ${item}`);
	// 	}
	// 	return true;
	// }

	async _startDebugging() {
		// await this._restartDocker();
		return vscode.commands.executeCommand('workbench.action.debug.start');
	}

	_isDockerExtInstalled() {
		const ext = vscode.extensions.getExtension('ms-azuretools.vscode-docker');
		if(ext)
			return ext.isActive;
		return false;
	}

	async _getNecessaryFiles(): Promise<NecessaryFiles> {
		const sls = await vscode.workspace.findFiles('serverless.yml','**/node_modules/**', 1);
		const docker = await vscode.workspace.findFiles('docker-compose.yml','**/node_modules/**', 1);
		const packageJson = await vscode.workspace.findFiles('package.json','**/node_modules/**', 1);
		const result = { sls: {}, docker: {}, packageJson: {} };
		if(sls && docker && sls.length > 0 && docker.length > 0){
			result.sls = sls.pop() || {};
			result.docker = docker.pop() || {};
			result.packageJson = packageJson.pop() || {};
		}
		return result;
	}

	_isValidSlsWorkspace(necFiles: NecessaryFiles) {
		if(necFiles.sls.fsPath, necFiles.docker.fsPath)
			return true;
		return false;
	}
}