import { SvelteSet } from "svelte/reactivity";

export const popupState: { currentPopup: Node|null } 
= $state({ currentPopup: null });