function proper_case(str) {
  // "example phrase" to "Example Phrase" excluding words and, to, of
  let words = str.toLowerCase().split(" ");
  for (var i = 0; i < words.length; i++) {
    let word = words[i].split("");
    if (
      (words[i] === "to" ||
        words[i] === "and" ||
        words[i] === "of" ||
        words[i] === "a" ||
        words[i] === "an" ||
        words[i] === "the" ||
        words[i] === "for" ||
        words[i] === "nor" ||
        words[i] === "but" ||
        words[i] === "yet" ||
        words[i] === "above" ||
        words[i] === "below" ||
        words[i] === "behind" ||
        words[i] === "around" ||
        /^https\:\/\/[a-zA-Z0-9\-\.\_\+\/]+$/.test(words[i])) === false
    )
      word[0] = word[0].toUpperCase();
    for (var j = 0; j < word.length; j++) {
      if (word[j] === "’") word[j] = "'";
    }
    words[i] = word.join("");
  }
  return words.join(" ");
}

function remove(array, item) {
  var buffer = [];
  for (var i in array) {
    if (array[i] === item) {
      continue;
    } else {
      buffer.push(array[i]);
    }
  }
  return buffer;
}

async function jumprole_cmd(message, client, Discord, prefix) {
  // Usage: jumprole <add/remove/replace>
  // set: jumprole add | <name> | <tier> | <roleid> | <info command output>
  // remove: jumprole remove <name>
  if (message.channel.id !== "482971711969427461") {
    return message.channel.send(
      "You must be in #mod-commands on the SMO Trickjumping server to use this command."
    );
  }
  const kv = require("keyv");
  const jumps = new kv("sqlite://modules/trickjump/dbs/jumps.db"); // Access jumps database
  const jump_list = await jumps.get("jump_list");
  const tiers = new kv("sqlite://modules/trickjump/dbs/jumps.db", {
    namespace: "tiers",
  });
  const tier_list = new kv("sqlite://modules/trickjump/dbs/tier-list.db");
  const all_tiers = await tier_list.get("list");
  var args = message.content.split(" ");
  args.shift();

  switch (args[0]) {
    case "set": {
      // Get actual arguments for the command based on pipes
      // jumprole set | <name> | <tier> | <command output>
      let new_args = message.content
        .split("|")
        .map((x) => proper_case(x.trim()));
      if (new_args.length !== 4) {
        message.channel.send(
          `Incorrect command formatting. You can see the correct usage by listing all commands with \`${prefix}commands\`.`
        );
        return;
      }
      let name = new_args[1];
      if (/^\s+$/.test(name) || name === "") {
        return message.channel.send("Can't create a jump with a blank name.");
      }
      let jump_tier = new_args[2];
      let output = new_args[3];
      await jumps.set(name, {
        tier: jump_tier,
        output: output,
      });
      // Set the new jump list accordingly
      if (!jump_list || jump_list === []) {
        // If there is no list of jumps existing, create a new one with just 1 element [name]
        await jumps.set("jump_list", [name]);
      } else if (jump_list.includes(name) === false) {
        // Get existing jump list and add new jump to it, if it doesn't already exist
        let new_list = jump_list;
        if (!new_list) new_list = [name];
        else new_list.push(name);
        await jumps.set("jump_list", new_list);
      }
      // Tiers database
      const tiers = new kv("sqlite://modules/trickjump/dbs/jumps.db", {
        namespace: "tiers",
      });
      const tier_list = new kv("sqlite://modules/trickjump/dbs/tier-list.db");
      let tier = await tiers.get(jump_tier);
      // Make sure tier list includes our jump's tier
      if (!all_tiers) {
        all_tiers = [jump_tier];
        await tier_list.set("list", all_tiers);
      } else if (all_tiers && all_tiers.includes(jump_tier) === false) {
        all_tiers.push(jump_tier);
        await tier_list.set("list", all_tiers);
      }
      // Make sure the properties of our jump's tier exist
      if (!tier) {
        await tiers.set(jump_tier, [name]);
        await message.react("✅");
      } else if (tier.includes(name) === false) {
        tier.push(name);
        await tiers.set(jump_tier, tier);
        await message.react("✅");
      } else {
        message.channel.send(
          `There is already a jump with the name ${name} in that tier.`
        );
        return;
      }
      break;
    }
    case "remove": {
      let name = proper_case(
        message.content.split(prefix + "jumprole remove")[1].trim()
      );
      if (!name || /^\s+$/.test(name)) {
        name = " ";
      }
      // Just delete the name of the jump and its values from the database
      let jump = await jumps.get(name);
      let jump_tier = jump.tier;
      let tier = await tiers.get(jump_tier);
      if (tier.indexOf(name) > -1) {
        // list of jumps in its tier has the jump
        await tiers.set(jump_tier, remove(tier, name));
      }
      jumps.delete(name);
      // Removes element from jump_list, if it exists
      if (jump_list.indexOf(name) > -1) {
        await jumps.set("jump_list", remove(jump_list, name));
      }
      await message.react("✅");
      break;
    }
    default: {
      message.channel.send(
        `Incorrect command formatting. You can see the correct usage by listing all commands with \`${prefix}commands\`.`
      );
      break;
    }
  }
}
module.exports = jumprole_cmd;
