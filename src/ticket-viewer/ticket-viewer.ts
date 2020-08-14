import FizzTools from '../fizz-tools';
import { commands, extensions, ExtensionContext, Uri } from 'vscode';
import { GitExtension } from '../interfaces/git';

const JIRA_URL = 'https://fizzmod.atlassian.net/browse/';

export default class TicketViewer extends FizzTools {

	gitRepo:any;

	constructor(context: ExtensionContext) {
		super(context);

		const gitExtension = extensions.getExtension<GitExtension>('vscode.git');

		if(!gitExtension)
			throw 'Cannot get git extension instance';

		const git = gitExtension.exports.getAPI(1);
		if(git.state !== 'initialized' && !git.repositories)
			throw 'Git isn\'t initialized in the actual workspace';

		this.gitRepo = git.repositories[0];

		//con esto lees eventos en git
		// git.repositories[0].state.onDidChange((e)=>{
		// 	console.log('cambio algo wacho!');
		// });
	}

	subscribe() {
		super.subscribe('extension.ticket-viewer');
	}

	async onRun() {
		const regex = /^([aA-zZ]{3}-[0-9]{3})(.*)$/;
		const branchName = this.gitRepo.state.HEAD.name || '';

		if(!branchName || branchName === 'master' || branchName === 'qa' || branchName === 'beta')
			throw 'Invalid branch or branch name does not contain a valid ticket name';

		const tkName = branchName.replace(regex,'$1');

		await commands.executeCommand('vscode.open',
			Uri.parse(JIRA_URL + tkName));

		// this.openWebView('test',JIRA_URL + tkName);

		return true;
	}

}