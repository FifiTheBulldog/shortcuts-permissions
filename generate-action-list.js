/* 
generate-action-list.js

Generates an object containing all the actions and permissions in WFActions.plist and saves it to actions.json.

Permissions with a value of `null` in permissions.json are ignored.
Action listings in overrides.json take precedence over WFActions.plist.

Supports macOS, iOS (direct filesystem access), and iSH on iOS.
*/

const bplist = require('bplist-parser');
const { writeFileSync } = require('fs');

const actionsJSONPath = './actions.json';

const actions = require(actionsJSONPath);
const overrides = require('./overrides.json');
const permissions = require('./permissions.json');

function pushOrNot(arr, item) {
    if ((permissions[item] != null) && (!arr.includes(item))) arr.push(item);
}

(async () => {
    const actionsDict = await bplist.parseFile(require('./get-wfactions-path.js'))[0];

    for (const actionID in actionsDict) {
        let perms = [];

        if (overrides[actionID]) {
            perms = overrides[actionID];
        } else {
            const resources  = actionsDict[actionID].RequiredResources;
            if (resources) {
                for (const resource of resources) {
                    if (typeof resource === "string") {
                        pushOrNot(perms, resource)
                    } else {
                        if (resource.WFAccountClass) {
                            pushOrNot(perms, resource.WFAccountClass);
                        } else {
                            pushOrNot(perms, resource.WFResourceClass);
                        }
                    }
                }
            }

            if (actionsDict[actionID].AppIdentifier == "com.apple.Preferences") pushOrNot(perms, "Settings");
            if (actionsDict[actionID].AppIdentifier == "com.apple.TVRemoteUIService") pushOrNot(perms, "Apple TV Remote");
        }

        perms.sort();

        actions[actionID] = perms;
    }

    writeFileSync(actionsJSONPath, JSON.stringify(actions, null, 4));
})();