import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';


import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import { getDefault } from "resource:///org/gnome/shell/misc/systemActions.js";
import Gio from "gi://Gio";
import GObject from "gi://GObject";
import { PACKAGE_VERSION } from "resource:///org/gnome/shell/misc/config.js";

// Import Utils class

//import  
import * as Utils from "./utils.js";
import * as bootloader from "./bootloader.js";


const RebootQuickMenu = GObject.registerClass(
class RebootQuickMenu extends QuickSettings.QuickMenuToggle {

    _init() {
        const init_params = { iconName: 'system-reboot-symbolic', toggleMode: false };
        init_params.title = "Reboot Into";
        super._init(init_params);

        // Set toggle to be unchecked
        this.checked = false;
        
        // Open menu and set toggle check to true
        this.clickedID = this.connect("clicked", () => {
            this.menu.open();
            this.checked = true;
        });

        // Connect 'menu-closed' to update checked state
        this.menuClosedID = this.menu.connect("menu-closed", () => {
            this.checked = false;
        });
        
        // Add boot options to menu
        //this.createBootMenu();
    }

    cleanConns() {
        // Disconnect all connections
        this.disconnect(this.openStateID);
        this.disconnect(this.clickedID);
    }

    async createBootMenu() {
        // Get boot options
        const type = await bootloader.GetUseableType();

        const header_title = `Boot Options - ${type}`;

        // Set Menu Header
        this.menu.setHeader('system-reboot-symbolic', header_title, 'Reboot into the selected entry');

        const loader = await bootloader.GetUseable(type);

        if (loader === undefined) {
            // Set Menu Header
            this.menu.setHeader('system-reboot-symbolic', 'Error', 'The selected boot loader cannot be found...');

            // Add reload option, to refresh extension menu without reloading GNOME or the extension
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            this.menu.addAction('Reload', () => {
                this.menu.removeAll();
                this.createBootMenu();
            });

            // Add button to open settings
            this.menu.addAction('Settings', () => {
                ExtensionUtils.openPrefs();
            });

            return;
        }

        loader.GetBootOptions().then(([bootOps, defaultOpt]) => {
            if (bootOps !== undefined) {
                this._itemsSection = new PopupMenuSection();

                for (let [title, id] of bootOps) {
                    this._itemsSection.addAction(String(title), () => {
                        // Set boot option
                        loader.SetBootOption(String(id)).then(result => {
                            if (result) {
                                // On success trigger restart dialog
                                new getDefault().activateRestart();
                            }
                        });
                    }, (title === defaultOpt || id === defaultOpt)? "pan-end-symbolic" : undefined);
                }

                this.menu.addMenuItem(this._itemsSection);
            }

            // Add reload option, to refresh extension menu without reloading GNOME or the extension
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            this.menu.addAction('Reload', () => {
                this.menu.removeAll();
                this.createBootMenu();
            });

            // Add button to open settings
            this.menu.addAction('Settings', () => {
                Extension.openPrefs();
            });

            loader.CanQuickReboot().then(async result => {
                if (!result) return;
                if (!await loader.QuickRebootEnabled()) {
                    this.menu.addAction('Enable Quick Reboot', async () => {
                        await loader.EnableQuickReboot();
                        this.menu.removeAll();
                        this.createBootMenu();
                    });
                }
                else {
                    this.menu.addAction('Disable Quick Reboot', async () => {
                        await loader.DisableQuickReboot();
                        this.menu.removeAll();
                        this.createBootMenu();
                    });
                }
            });

        }).catch((error) => {
            Utils._log(error);
            // Only do this if the current bootloader is grub
            if (Utils.getCurrentBootloaderType() === 1)
            {
                // Only add this if all fails, giving user option to make the config readable
                this.menu.addMenuItem(new PopupSeparatorMenuItem());
                this.menu.addAction('Fix Grub.conf Perms', async () => {
                    await Utils.getCurrentBootloader().setReadable();
                    this.menu.removeAll();
                    this.createBootMenu();
                });
            }
        })
    }
});

export default class CustomReboot extends Extension {
    constructor() {
    }

    
    enable() {
        // Add items to QuickSettingsMenu
        this._indicator = new QuickSettings.SystemIndicator(this);
        this._indicator.quickSettingsItems.push(new RebootQuickMenu());
        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);

        // Ensure the tile(s) are above the background apps menu (Only running when GNOME 44 is detected)
        /*if (PACKAGE_VERSION.startsWith("43")) return;
        for (const item of this.quickSettingsItems) {
            QuickSettings.menu._grid.set_child_below_sibling(item,
                QuickSettings._backgroundApps.quickSettingsItems[0]);
        }*/
    }

    disable() {
        this.quickSettingsItems.forEach(item => {
            item.cleanConns();
            item.destroy();
        });
    }
}
