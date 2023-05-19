const QuickSettingsMenu = imports.ui.main.panel.statusArea.quickSettings;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();


const { GObject } = imports.gi;
const PopupMenu = imports.ui.popupMenu;
const QuickSettings = imports.ui.quickSettings;
const SystemActions = imports.misc.systemActions;

// Import Utils class
const Utils = Me.imports.utils;
const bootloader = Me.imports.bootloader;


const RebootQuickMenu = GObject.registerClass(
class RebootQuickMenu extends QuickSettings.QuickMenuToggle {

    _init() {
        super._init({
            label: 'Reboot Into',
            iconName: 'system-reboot-symbolic',
            toggleMode: false,
        });

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
        this.createBootMenu();
    }

    cleanConns() {
        // Disconnect all connections
        this.disconnect(this.openStateID);
        this.disconnect(this.clickedID);
    }

    async createBootMenu() {
        // Get boot options
        const type = await bootloader.GetUseableType();

        // Set Menu Header
        const menu_text = `Reboot into the selected entry using ${type}`;
        this.menu.setHeader('system-reboot-symbolic', 'Boot Options', menu_text);

        const loader = await bootloader.GetUseable(type);
        loader.GetBootOptions().then(([bootOps, defaultOpt]) => {
            if (bootOps !== undefined) {
                this._itemsSection = new PopupMenu.PopupMenuSection();
                let x = 0;
                bootOps.forEach((title, id) => {
                    this._itemsSection.addAction(String(title), () => {
                        // Set boot option
                        loader.SetBootOption(String(id)).then(result => {
                            if (result) {
                                // On success trigger restart dialog
                                new SystemActions.getDefault().activateRestart();
                            }
                        });
                    }, (title === defaultOpt || id === defaultOpt)? "pan-end-symbolic" : undefined);
                    x++;
                });
                this.menu.addMenuItem(this._itemsSection);
            }

            // Add reload option, to refresh extension menu without reloading GNOME or the extension
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            this.menu.addAction('Reload', () => {
                this.menu.removeAll();
                this.createBootMenu();
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
                this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
                this.menu.addAction('Fix Grub.conf Perms', async () => {
                    await Utils.getCurrentBootloader().setReadable();
                    this.menu.removeAll();
                    this.createBootMenu();
                });
            }
        })
    }
});

class Extension {
    constructor() {
        this.quickSettingsItems = [];
    }

    
    enable() {
        // Add menu to the items list
        this.quickSettingsItems.push(new RebootQuickMenu());

        // Add items to QuickSettingsMenu
        QuickSettingsMenu._addItems(this.quickSettingsItems);
    }

    disable() {
        this.quickSettingsItems.forEach(item => {
            item.cleanConns();
            item.destroy();
        });
        this.quickSettingsItems = [];
    }
}

function init() {
    return new Extension();
}
