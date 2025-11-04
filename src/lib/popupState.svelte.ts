import { SvelteSet } from "svelte/reactivity";

export const popupState = $state({
    popupAnchors: new SvelteSet<Node>()
});