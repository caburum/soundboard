import { Howl } from 'howler';
import type { Sound } from './types';
import { get, readable, type Readable } from 'svelte/store';

export const soundDefaults: Partial<Sound> = {
	fadeOutDuration: 300,
	volume: 1,
};

export class SoundHowl {
	_howl: Howl;
	_sound: Sound;
	_soundUrl: string;

	constructor(sound: Sound) {
		// defaults
		let mySound = Object.assign({}, soundDefaults, sound);
		if (mySound.loop) mySound.oneAtATime = true;
		this._sound = mySound;
	}

	// absolutely cursed state tracking so the svelte ui can be reactive
	_playingCount: number = 0;
	_updatePlayingCount: () => void = () => {
		throw new Error('not initialized');
	};
	playing: Readable<boolean> = readable(false, (set) => {
		this._updatePlayingCount = () => {
			set(this._playingCount > 0);
		};
	});

	async initializeHowl(dirHandle: FileSystemDirectoryHandle) {
		// cleanup any old copy
		if (this._soundUrl) URL.revokeObjectURL(this._soundUrl);
		this._howl?.unload();

		this._soundUrl = URL.createObjectURL(await (await dirHandle.getFileHandle(this._sound.filename)).getFile());
		this._howl = new Howl({
			src: this._soundUrl,
			format: this._sound.filename.split('.').pop(),
			html5: true,
			loop: this._sound.loop,
			volume: this._sound.volume,
		});
		this._howl.on('play', () => {
			this._playingCount++;
			this._updatePlayingCount();
		});
		this._howl.on('end', () => {
			setTimeout(() => {
				this._playingCount--;
				this._updatePlayingCount();
			}, 1); // for looping sounds, makes the ui not glitch
		});
		this._howl.on('stop', () => {
			this._playingCount = 0;
			this._updatePlayingCount();
		});
	}

	stop() {
		this._howl.stop();
	}

	fadeStop(duration = this._sound.fadeOutDuration) {
		this._howl.fade(this._howl.volume(), 0, duration);
		setTimeout(() => this._howl.stop(), duration);
	}

	play() {
		if (!this._sound.oneAtATime || !get(this.playing)) {
			this._howl.volume(this._sound.volume);
			this._howl.play();
		}
	}
}
