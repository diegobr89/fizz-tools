import { env, window } from 'vscode';
import FizzTools from '../fizz-tools';
import { JanisWorkspaceHelper, Environments } from "../janis-workspace-helper";

export default class JanisDbConnString extends FizzTools {

	subscribe() {
		super.subscribe('extension.janis-db-conn-string');
	}

	async onRun() {

		const selection = await window.showQuickPick(Object.keys(Environments)) || 'local';
		const selectedEnv = (<any>Environments)[selection];

		const file = await JanisWorkspaceHelper.getConfigFileByEnv(selectedEnv);
		const protocol = this.getProtocol(file);
		const host = this.getHost(file);

		if(selectedEnv === Environments.local){
			const dockerFile = await JanisWorkspaceHelper.getDockerFile();
			const port = dockerFile.services.mongo.ports[0].split(':')[0];
			return this.clipboardAndNotify(`${protocol}${host}:${port}`);
		}

		return this.clipboardAndNotify(`${protocol}${host}`);

		return
	}

	private async clipboardAndNotify(text: string) {
		env.clipboard.writeText(text);
		return window.showInformationMessage('Connection string coppied to cliboard!');
	}

	private getProtocol({ database: { core: { protocol = '', dbProtocol = '' } = {} } = {} } = {}){
		return protocol || dbProtocol || 'mongodb://';
	}

	private getHost({ database: { core: { host = '', dbHost = '' } = {} } = {} } = {}){
		return host || dbHost;
	}

}