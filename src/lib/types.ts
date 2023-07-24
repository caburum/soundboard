import type { Howl } from 'howler';

export interface Sound {
	name: string;
	filename: string;
	/** makes the sound loop until manually stopped */
	loop?: boolean;
	/** makes only one instance play at a time */
	oneAtATime?: boolean;
	/** fade duration in ms */
	fadeOutDuration?: number;
	volume?: number;
}

/** written to `config.json` in the project folder, stores whatever */
export interface Config {
	sounds?: Sound[];
}
