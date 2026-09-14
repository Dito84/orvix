import { Injector } from '@angular/core';
import { StorageMap } from '@ngx-pwa/local-storage';
import { of } from 'rxjs';
import {
    DEFAULT_PARENTAL_CONTROL_PIN,
    DEFAULT_PARENTAL_CONTROL_PIN_HASH,
    Settings,
} from '@iptvnator/shared/interfaces';
import { EpgSourceSettingsService } from './epg-source-settings.service';
import { ParentalControlService } from './parental-control.service';
import { SettingsStore } from './settings-store.service';

describe('ParentalControlService', () => {
    let storedSettings: Partial<Settings> | null;
    let injector: Injector;

    beforeEach(() => {
        storedSettings = null;
        const storage = {
            get: jest.fn(() => of(storedSettings)),
            set: jest.fn(() => of(undefined)),
        };

        injector = Injector.create({
            providers: [
                SettingsStore,
                ParentalControlService,
                EpgSourceSettingsService,
                { provide: StorageMap, useValue: storage },
            ],
        });
    });

    async function getServiceAfterLoad(): Promise<ParentalControlService> {
        const store = injector.get(SettingsStore);
        await store.loadSettings();
        return injector.get(ParentalControlService);
    }

    it('is enabled with the default PIN (6699) out of the box', async () => {
        const service = await getServiceAfterLoad();

        expect(service.isEnabled()).toBe(true);
        expect(service.hasPin()).toBe(true);
        await expect(
            service.verifyPin(DEFAULT_PARENTAL_CONTROL_PIN)
        ).resolves.toBe(true);
        await expect(service.verifyPin('0000')).resolves.toBe(false);
    });

    it('setPin replaces the hash and (re-)enables parental control', async () => {
        const service = await getServiceAfterLoad();

        await service.setPin('1234');

        await expect(service.verifyPin('1234')).resolves.toBe(true);
        await expect(
            service.verifyPin(DEFAULT_PARENTAL_CONTROL_PIN)
        ).resolves.toBe(false);
        expect(service.isEnabled()).toBe(true);
    });

    it('disable turns enabled off without touching the stored PIN hash', async () => {
        const service = await getServiceAfterLoad();
        const store = injector.get(SettingsStore);

        await service.disable();

        expect(service.isEnabled()).toBe(false);
        expect(store.getSettings().parentalControl?.pinHash).toBe(
            DEFAULT_PARENTAL_CONTROL_PIN_HASH
        );
    });

    it('updateKeywords replaces the auto-hide keyword list', async () => {
        const service = await getServiceAfterLoad();

        await service.updateKeywords(['blocked', 'nope']);

        expect(service.keywords()).toEqual(['blocked', 'nope']);
    });
});
