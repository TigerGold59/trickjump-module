async function jumprole_cmd(message, client, Discord, prefix) {
  // Usage: jumprole <add/remove/replace>
  // set: jumprole add | <name> | <tier> | <roleid> | <info command output>
  // remove: jumprole remove <name>
  if (message.channel.id !== "482971711969427461") {
    return message.channel.send("You must be in #mod-commands on the SMO Trickjumping server to use this command.")
  }
  const kv = require("keyv")
  const jumps = new kv("sqlite://modules/trickjump/dbs/jumps.db") // Access jumps database

  var args = message.content.split(" ");
  args.shift()

  switch (args[0]) {
    case "set":
      // Get actual arguments for the command based on pipes
      // jumprole set | <name> | <tier> | <command output>
      let new_args = message.content.split(" | ");
      let jname = new_args[1];
      let jump_tier = new_args[2];
      let output = new_args[3];
      if (output && !(new_args[4])) { // If there are 3 pipelines and not 5
        jumps.set(jname, {
          "tier": jump_tier,
          "output": output //
        }).then(() => {
          // After getting list of jumps, set the new list accordingly
          jumps.get("jump_list").then(jump_list => {
            if (!jump_list) {
              // If there is no list of jumps existing, create a new one with just 1 element [name]
              jumps.set("jump_list", [jname]);
            }
            else if (jump_list.includes(jname) === false) {
              // Get existing jump list and add new jump to it, if it doesn't already exist
              let new_list = jump_list;
              if (!new_list) {
                new_list = []
              }
              new_list.push(jname);
              jumps.set("jump_list", new_list);
            }
          })
        });
        // Tiers database
        const tiers = new kv("sqlite://modules/trickjump/dbs/jumps.db", {namespace: "tiers"});
        const tier_list = new kv("sqlite://modules/trickjump/dbs/tier-list.db")
        var real_list = await tier_list.get("list")
        let tier = await tiers.get(jump_tier)
        if (real_list) {
          if (real_list.includes(jump_tier) === false) {
            real_list.push(jump_tier)
            tier_list.set("list", real_list)
          }
        }
        // If the tier doesn't exist
        if (!tier) {
          tiers.set(jump_tier, [jname]);
          // Get the current list of tiers
          let tier_list_current = await tier_list.get("list")
          if (!tier_list_current) {
            tier_list_current = []
          }
          if (real_list.includes(jump_tier) === false) {
            // Add it to the new list
            tier_list_current.push(jump_tier)
          }
          // Set the new list
          tier_list.set("list", tier_list_current)
        }
        else if (tier.includes(jname) === false) {
          // If the tier doesn't have the specified jump in it (expected case), add it
          let list = tier;
          if (!list) {
            list = []
          }
          list.push(jname);
          tiers.set(jump_tier, list);
        }
        message.channel.send(`Jump command added. Use ${prefix}tj info ${jname} for the info command.`)
      }
      else {
        message.channel.send(`Invalid usage. Use ${prefix}commands for usage.`)
      }
      break;
    case "remove":
      let name = message.content.split(prefix + "jumprole remove ")[1]
      if (name) {
        // Just delete the name of the jump and its values from the database
        let jump = await jumps.get(name)
        let tier = jump.tier
        let tiers = new kv("sqlite://modules/trickjump/dbs/jumps.db", {namespace: "tiers"})
        tiers.get(tier).then(list => {
          let jump_list = list
          let index = jump_list.indexOf(name);
          if (index > -1) {
            jump_list.splice(index, 1);
            // Deleted jump from list of jumps in its tier
          }
          tiers.set(tier, jump_list)
        })
        jumps.delete(name);
        let list = await jumps.get("jump_list");
        // Removes element from jump_list, if it exists
        let jump_list = list
        let index = jump_list.indexOf(name);
        if (index > -1) {
          jump_list.splice(index, 1);
        }
        message.channel.send("Removed " + name + " from the list of jumps. Please tell everyone that has the role to remove it from themselves.")
        jumps.set("jump_list", jump_list)
      }
      break;
    default:
      message.channel.send(`Invalid usage. Use ${prefix}commands for usage.`)
      break;
  }
}
module.exports = jumprole_cmd;
