const config = document.currentScript?.dataset.viewTransitionNames?.split(/\s+/) ?? ['main'];
const oldDuration: number[] = [];
const newDuration: number[] = [];
const vtns: string[] = [];
for (const c of config) {
	const [name, option] = c.split('@');
	vtns.push(name);

	if (option) {
		const [a, b] = option.split('&');
		oldDuration.push(parseInt(a, 10));
		newDuration.push(parseInt(b, 10));
	} else {
		oldDuration.push(0);
		newDuration.push(0);
	}
}
addEventListener('pageswap', (e) => {
	sessionStorage.setItem('vtbagCamshaftScrollY', '' + scrollY);
	sessionStorage.setItem('vtbagCamshaftNavigationType', e.activation?.navigationType ?? 'unknown');
});
addEventListener('pagereveal', async (e) => {
	if (!e.viewTransition) return;
	let newOffset = 0;

	if (sessionStorage.getItem('vtbagCamshaftNavigationType') === 'traverse') {
		newOffset = scrollY;
	} else {
		const hash = location.hash ?? '#top';
		if (hash) {
			document.documentElement.querySelector(hash)?.scrollIntoView({
				behavior: 'instant',
				block: 'start',
			});
			newOffset = scrollY;
		}
	}
	const oldOffset = parseFloat(sessionStorage.getItem('vtbagCamshaftScrollY') ?? '0');

	await e.viewTransition?.ready;

	vtns?.forEach((vtn, idx) => {
		const groupStyle = getComputedStyle(
			document.documentElement,
			`::view-transition-group(${vtn})`
		);
		let groupAnimationName = groupStyle.animationName;
		if (groupAnimationName.startsWith('"')) {
			groupAnimationName = groupAnimationName.slice(1, -1);
		}
		if (groupAnimationName === `-ua-view-transition-group-anim-${vtn}`) {
			const ms = (s: string) => {
				const res = parseFloat(s);
				return s.endsWith('ms') ? res : res * 1000;
			};
			let option = {
				id: `vtbag-camshaft-${vtn}-old`,
				pseudoElement: `::view-transition-old(${vtn})`,
				composite: 'accumulate',
				fill: groupStyle.animationFillMode,
				easing: groupStyle.animationTimingFunction,
				duration: oldDuration[idx] || ms(groupStyle.animationDuration),
			} as KeyframeAnimationOptions;

			document.documentElement.animate({ top: [`0px`, `${newOffset - oldOffset}px`] }, option);

			option = {
				id: `vtbag-camshaft-${vtn}-new`,
				pseudoElement: `::view-transition-new(${vtn})`,
				composite: 'accumulate',
				fill: groupStyle.animationFillMode,
				easing: groupStyle.animationTimingFunction,
				duration: newDuration[idx] || oldDuration[idx] || ms(groupStyle.animationDuration),
			} as KeyframeAnimationOptions;

			document.documentElement.animate({ top: [`${oldOffset - newOffset}px`, '0px'] }, option);
		}
	});
});
