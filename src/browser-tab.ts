import { window, ViewColumn, WebviewPanel } from 'vscode';
import axios from 'axios';

export default class BrowserTab {

	private url: string;
	private commandName: string;
	private activeBrowser: WebviewPanel | null;
	private contentToShow: string = '';
	private loader: string = this.defaultLoader;

	set loaderHtml(html: string) {
		this.loader = html;
	}

	constructor(commandName: string, url: string) {
		this.commandName = commandName;
		this.url = url;
		this.activeBrowser = null;
	}

	injectStyle(){
		return ''
	}

	async loadUrlData() {
		const { data } = await axios.get(this.url);
		const styled = data.replace('<head>',`<head><style>${this.injectStyle()}</style>`);
		this.contentToShow = styled;
	}

	async reloadContent() {
		if(!this.activeBrowser)
			return;

		await this.loadUrlData();
		this.activeBrowser.webview.html = this.contentToShow;
	}

	show(title: string, viewColumn: ViewColumn){
		this.activeBrowser = window.createWebviewPanel(
			this.commandName, title, viewColumn, { enableScripts: true });

		if(!this.activeBrowser)
			throw new Error('An error ocurred when trying to create the webview');

		this.activeBrowser.webview.html = this.contentToShow ? this.contentToShow : this.loader;

		this.activeBrowser.onDidDispose(() => {
			this.activeBrowser = null;
			this.contentToShow = '';
		});
	}

	async showAndLoad(title: string, viewColumn: ViewColumn) {
		this.show(title, viewColumn);
		await this.reloadContent();
	}

	protected get defaultLoaderLogo() {
		return 'https://d2vrnm4zvhq6yi.cloudfront.net/assets/loader_puntos-df9857dfaf7eeb01c9cb2c2d1d208a8365ea4cdab85e1adeadaceff0c8f27964.gif';
	}

	private get defaultLoader(): string {
		return `
			<html>
				<head>
					<style>
						html, body { width: 100%; height: 100% }
						body {
							padding: 0;
							margin: 0;
							display: -webkit-box;
							display: -moz-box;
							display: -ms-flexbox;
							display: -webkit-flex;
							display: flex;
							align-items: center;
							justify-content: center;
						}
						body img {
							width: 100px;
							height: 100px;
						}
					</style>
				</head>
				<body>
					<img src="${this.defaultLoaderLogo}">
				</body>
			</html>`;
	}

}