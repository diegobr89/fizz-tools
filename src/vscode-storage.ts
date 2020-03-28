// import FsPromise from './fs-promise'.promise;
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import * as vscode from 'vscode';

export class VscodeStorage {

	file: string = '';
	storageFile: string = '';

	constructor(file: string){
		this.file = file;

		if(vscode.workspace.workspaceFolders)
		 this.storageFile = vscode.workspace.workspaceFolders[0].uri.fsPath + '/.vscode/' + this.file;
	}

	async _getStorageContent() {
		const rootFolder = this.storageFile.replace(this.file, '');

		if(!fs.existsSync(rootFolder))
			await fsPromises.mkdir(rootFolder);

		if(!fs.existsSync(this.storageFile))
			await fsPromises.writeFile(this.storageFile, '{}');


		const data = await fsPromises.readFile(this.storageFile);
		const parsed = JSON.parse(data.toString());
		return parsed;
	}

	async getKey(key: string) {
		const parsed = await this._getStorageContent();
		if(!key && parsed)
			return parsed;

		if (parsed && parsed[key])
			return parsed[key];
		return false;
	}

	async setKey(key:string, value:any){
		if(!key)
			throw 'Key cannot be empty'
		const parsed = await this._getStorageContent();
		parsed[key] = value;
		fsPromises.writeFile(this.storageFile, JSON.stringify(parsed, null, '  '));
	}
}