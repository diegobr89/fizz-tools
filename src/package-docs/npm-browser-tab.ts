import BrowserTab from '../browser-tab';

export default class NpmBrowserTab extends BrowserTab {

	protected get defaultLoaderLogo() {
		return 'https://lh3.googleusercontent.com/proxy/vdC4FSrd308PU7ec2VfxwRalxjeBRgM8nVIN5Xeb4zKuedmRfqec-ewcSKS5PQzKJHhMwCBryR1M_BXa4ZufHq2lpMnLopdd274kckcp4Ak';
	}

	injectStyle() {
		return `
			body { background-color: white !important; }
			._755f5b0f { display:none !important; }
			.fdbf4038 { display: none !important; }
			.cfb2a888 { display: none !important; }
			._6d9832ac code { color: black !important; }`;
	}

};