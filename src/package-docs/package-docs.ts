import FizzTools from '../fizz-tools';
import { window, commands, Uri, ViewColumn } from 'vscode';
import NpmBrowserTab from './npm-browser-tab';

const DOCS_URL = 'https://www.npmjs.com/package/'
const COMMAND_NAME = 'extension.package-docs';
export default class PackageDocs extends FizzTools {

	subscribe() {
		super.subscribe(COMMAND_NAME);
	}

	async onRun() {
		// current editor
		const editor = window.activeTextEditor;

		// check if there is no selection
		if (!editor || !editor.selection.isEmpty)
		 return false;

		const position = editor.selection.active;
		const lineText = editor.document.lineAt(position.line).text;

		const regex = /require\(['"]([^.].*)['"]\);$/g;
		const regexResult = regex.exec(lineText) || [];

		if(regexResult.length < 2)
			return false;

		const packageName = regexResult.pop();
		const url = `${DOCS_URL}${packageName}`;

		const browser = new NpmBrowserTab(COMMAND_NAME, url);
		await browser.showAndLoad(`Docs - ${packageName}`, ViewColumn.Beside);

	}

};
