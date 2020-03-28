import { VscodeStorage } from './vscode-storage';

const STORAGE_FILE = 'fizz-tools-storage.json';

export class ExtensionStorage extends VscodeStorage {

	extModule: string = '';

		constructor(extModule: string){
			super(STORAGE_FILE)
			this.extModule = extModule;
	}

	async getKey(key: string) {
		const extModule = await super.getKey(this.extModule);
		if (extModule && extModule[key])
			return extModule[key];
		return false;
	}

	async setKey(key:string, value:any){
		const insert: any = {};
		insert[key] = value
		return super.setKey(this.extModule, insert);
	}
}