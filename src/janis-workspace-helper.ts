import * as vscode from 'vscode';
import * as yaml from 'yaml';
import { promises as fsPromises } from 'fs';

interface MainFiles {
	sls: any,
	docker: any,
	packageJson: any
}

enum Environments {
	local = 'local',
	beta = 'beta',
	qa = 'qa',
	prod = 'prod',
}

class JanisWorkspaceHelper {

	static async getConfigFileByEnv(environment: Environments): Promise<any> {
		const getPath = (env: string) => `src/environments/${env}/.janiscommercerc.json`;
		const [{ fsPath }] = await vscode.workspace.findFiles(getPath(environment),'', 1)
		const file = await fsPromises.readFile(fsPath);
		return JSON.parse(file.toString());
	}

	static async getDockerFile(): Promise<any> {
		const [{ fsPath }] = await vscode.workspace.findFiles('docker-compose.yml','**/node_modules/**', 1);
		const file = await fsPromises.readFile(fsPath);
		return yaml.parse(file.toString());
	}

	static async getMainFiles(): Promise<MainFiles> {
		const sls = await vscode.workspace.findFiles('{serverless.yml,serverless.js}','**/node_modules/**', 1);
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
}

export {
	MainFiles,
	Environments,
	JanisWorkspaceHelper
}