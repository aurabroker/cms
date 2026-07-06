/** Reaktywny przełącznik motywu (rune). Trzyma wybór w localStorage. */
let dark = $state(false);

export const theme = {
	get dark() {
		return dark;
	},
	init() {
		if (typeof document === 'undefined') return;
		dark = document.documentElement.getAttribute('data-theme') === 'dark';
	},
	toggle() {
		dark = !dark;
		const val = dark ? 'dark' : '';
		document.documentElement.setAttribute('data-theme', val);
		try {
			localStorage.setItem('theme', dark ? 'dark' : 'light');
		} catch {
			/* ignore */
		}
	}
};
