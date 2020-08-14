// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ToggleSlsDebug } from './toggle-sls-debug/';
import { TicketViewer } from './ticket-viewer/';
import { JanisDbConnString } from './janis-db-conn-string';
import { PackageDocs } from './package-docs';


export function activate(context: vscode.ExtensionContext) {
	try {

		new ToggleSlsDebug(context).subscribe();
		new TicketViewer(context).subscribe();
		new JanisDbConnString(context).subscribe();
		new PackageDocs(context).subscribe();

	} catch(error) {
		vscode.window.showErrorMessage(error || error.message);
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}
