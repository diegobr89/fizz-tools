import * as vscode from 'vscode';

export default abstract class FizzTools {
	context: vscode.ExtensionContext;

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
	}

	abstract async onRun(...args: any): Promise<any>;

	// subscribe(command: string, func: any) {
	subscribe(command: string) {
		// this.context.subscriptions.push(
		//   vscode.commands.registerCommand(command, func));
		this.context.subscriptions.push(
      vscode.commands.registerCommand(command, this._callWithTry.bind(this)));
	}

	async _callWithTry(...args: any) {
		try{
			return this.onRun(...args)
		} catch(error){
			await vscode.window.showErrorMessage(error || error.message);
		}
	}
}