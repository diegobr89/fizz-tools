import FizzTools from '../fizz-tools';
import * as vscode from 'vscode';
import { GitExtension } from '../interfaces/git';
import * as http from 'http';
import { rejects } from 'assert';

const JIRA_URL = 'https://fizzmod.atlassian.net/browse/';


export default class TicketViewer extends FizzTools {

	gitRepo:any;

	constructor(context: vscode.ExtensionContext) {
		super(context);

		const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git');

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

		await vscode.commands.executeCommand('vscode.open',
			vscode.Uri.parse(JIRA_URL + tkName));

		return true;
	}

	async openWebView(title:string, url: string) {
		const panel = vscode.window.createWebviewPanel(
			'jiraTicket',
			title,
			vscode.ViewColumn.One,
			{
				enableScripts: true
			}
		);
		panel.webview.html = await this.getWebviewContent(url);
	}

	getWebviewContent(url: string): Promise<string> {
		return new Promise((resolve, rejects) => {
			let output: string = '';

			const req = http.request(new URL(url), (res) => {
				res.setEncoding('utf8');

				res.on('data', chunk => {
					output += chunk;
				});

				res.on('end', () => {
					return resolve(output);
				});
			});

			req.on('error', err => {
				return rejects(err)
			});

			req.end();
		});
	}

}