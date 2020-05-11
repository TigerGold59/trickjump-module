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

function inverse_concat(arr1, arr2) {
  let result = [];
  for (var i = 0; i < arr1.length; i++) {
    if (arr2.includes(arr1[i]) === false) {
      result.push(arr1[i]);
    }
  }
  return result;
}

function inclusive_concat(arr1, arr2) {
  let result = [];
  for (var i = 0; i < arr1.length; i++) {
    if (arr2.includes(arr1[i])) {
      result.push(arr1[i]);
    }
  }
  return result;
}

async function tj_cmd(message, client, Discord, prefix) {
  const kv = require("keyv");
  const jumps = new kv("sqlite://modules/trickjump/dbs/jumps.db");
  const jump_list = await jumps.get("jump_list");
  const tiers = new kv("sqlite://modules/trickjump/dbs/jumps.db", {
    namespace: "tiers",
  });
  const user_roles = new kv("sqlite://modules/trickjump/dbs/roles.db");
  let author_roles = await user_roles.get(message.author.id);
  const tier_list = new kv("sqlite://modules/trickjump/dbs/tier-list.db");
  let all_tiers = await tier_list.get("list");
  const upload = require("../../../upload_to_pastebin.js");
  let args = message.content.split(" ");
  args.shift(); // removes command from argument list
  if (args.length < 1) {
    message.channel.send(
      `Incorrect command formatting. Usage: \`${prefix}tj give <jump name>\` (without arrows), or list all commands with \`${prefix}commands\`.`
    );
    return;
  }
  switch (args[0]) {
    case "info": {
      let name = proper_case(message.content.split(`${prefix}tj info `)[1]); // %tj info <name>
      if (jump_list.includes(name)) {
        let info_data = await jumps.get(name);
        message.channel.send(
          `${info_data.output}\r\n\r\n Tier: ${info_data.tier}`
        );
      } else {
        message.channel.send(
          `That jump doesn't exist. Check for typos or list all jumps with \`${prefix}tj list_all\`.`
        );
      }
      break;
    }
    case "give": {
      if (!message.content.split(`${prefix}tj give `)[1]) {
        message.channel.send(
          `Incorrect command formatting. Usage: \`${prefix}tj give <jump name>\` (without brackets), or list all commands with \`${prefix}commands\`.`
        );
        return;
      }
      let name = proper_case(message.content.split(`${prefix}tj give `)[1]); // %tj give <name>
      if (jump_list.includes(name) === false) {
        // if this jump doesn't exist
        message.channel.send(
          `That jump doesn't exist. Check for typos or list all jumps with \`${prefix}tj list_all\`.`
        );
        return;
      }
      if (!author_roles) {
        // user has no roles
        author_roles = [name];
        await user_roles.set(message.author.id, author_roles);
        await message.react("✅");
        return;
      }
      if (author_roles.includes(name)) {
        // user already has the role
        message.channel.send(
          `You already have that jump. You can list your jumps with \`${prefix}tj list\`.`
        );
        return;
      }
      // user has other roles but not requested one
      author_roles.push(name);
      await user_roles.set(message.author.id, author_roles);
      await message.react("✅");
      return;
      break;
    }
    case "give_absolute": {
      // doesn't automatically change case of role name
      if (!message.content.split(`${prefix}tj give `)[1]) {
        message.channel.send(
          `Incorrect command formatting. Usage: \`${prefix}tj give <jump name>\` (without arrows), or list all commands with \`${prefix}commands\`.`
        );
        return;
      }
      let name = message.content.split(`${prefix}tj give `)[1]; // %tj give <name>
      if (jump_list.includes(name) === false) {
        // if this jump doesn't exist
        message.channel.send(
          `That jump doesn't exist. Check for typos or list all jumps with \`${prefix}tj list_all\`.`
        );
        return;
      }
      if (!author_roles) {
        // user has no roles
        author_roles = [name];
        await user_roles.set(message.author.id, author_roles);
        await message.react("✅");
        return;
      }
      if (author_roles.includes(name)) {
        // user already has the role
        message.channel.send(
          `You already have that jump. You can list your jumps with \`${prefix}tj list\`.`
        );
        return;
      }
      // user has other roles but not requested one
      author_roles.push(name);
      await user_roles.set(message.author.id, author_roles);
      await message.react("✅");
      return;
      break;
    }
    case "give_all": {
      await user_roles.set(message.author.id, jump_list);
      await message.react("✅");
      return;
      break;
    }
    case "remove": {
      let name = proper_case(message.content.split(`${prefix}tj remove `)[1]); // %tj remove <name>
      if (jump_list.includes(name) === false) {
        // role doesn't exist
        message.channel.send(
          `That jump doesn't exist. Check for typos or list all jumps with \`${prefix}tj list_all\`.`
        );
        return;
      }
      if (author_roles === undefined || author_roles === []) {
        // user's role list is empty
        message.channel.send("You don't have any jumps.");
        return;
      }
      let index = author_roles.indexOf(name);
      if (index > -1) {
        // user has the jump
        author_roles.splice(index, 1);
        await user_roles.set(message.author.id, author_roles);
        await message.react("✅");
        return;
      } else {
        // user doesn't have the jump but it exists
        message.channel.send(
          `You don't have that jump. Check for typos or list your jumps with \`${prefix}tj list\`.`
        );
        return;
      }
      break;
    }
    case "remove_absolute": {
      // doesn't automatically change case of role name
      let name = message.content.split(`${prefix}tj remove `)[1]; // %tj remove <name>
      if (jump_list.includes(name) === false) {
        // role doesn't exist
        message.channel.send(
          `That jump doesn't exist. Check for typos or list all jumps with \`${prefix}tj list_all\`.`
        );
        return;
      }
      let author_roles = await user_roles.get(message.author.id);
      if (author_roles === undefined || author_roles === []) {
        // user's role list is empty
        message.channel.send("You don't have any jumps.");
        return;
      }
      let index = author_roles.indexOf(name);
      if (index > -1) {
        // user has the jump
        author_roles.splice(index, 1);
        await user_roles.set(message.author.id, author_roles);
        await message.react("✅");
        return;
      } else {
        // user doesn't have the jump but it exists
        message.channel.send(
          `You don't have that jump. Check for typos or list your jumps with \`${prefix}tj list\`.`
        );
        return;
      }
      break;
    }
    case "remove_all": {
      await user_roles.set(message.author.id, []);
      await message.react("✅");
      return;
    }
    case "list": {
      let requested_id = message.content.split(`${prefix}tj list `)[1]
        ? message.content.split(`${prefix}tj list`)[1].trim()
        : null;
      let did_request_id = requested_id !== null; // did the user ask for someone else's role list?
      if (
        did_request_id &&
        new RegExp(`\\${prefix}tj list [0-9]{6,20}`, "i").test(
          message.content
        ) === false
      ) {
        message.channel.send(
          `Incorrect command formatting. Usage: \`${prefix}tj list <optional user ID>\` (without arrows), or list all commands with \`${prefix}commands\`.\r\nMake sure you are using the user's ID instead of mentioning them (https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-).`
        );
        return;
      }
      let list = did_request_id
        ? await user_roles.get(requested_id)
        : author_roles;
      if (!list || list.length === 0) {
        // user has no roles
        message.channel.send(
          `${did_request_id ? "They" : "You"} don't have any jumps.`
        );
        return;
      }
      let buffer = `${
        did_request_id ? "Their" : "Your"
      } Roles\r\n=================\r\n\r\n`;
      let updated_tiers = all_tiers; // for removing tiers; will update after for loop
      let already_iterated = []; // jumps already gone over
      let count = 0;
      // iterate over tiers
      for (var i = 0; i < all_tiers.length; i++) {
        let jumps_in_tier = await tiers.get(all_tiers[i]);
        if (inclusive_concat(jumps_in_tier, list).length === 0) {
          continue;
        }
        let updated_jumps_in_tier = jumps_in_tier;
        let did_remove = false; // were there any jumps that shouldn't be listed?
        if (!jumps_in_tier || jumps_in_tier.length < 1) {
          updated_tiers.splice(updated_tiers.indexOf(all_tiers[i]), 1);
          continue;
        }
        buffer += `\r\n${all_tiers[i]}\r\n==============\r\n`;
        // iterate over jumps in tier
        for (var j = 0; j < jumps_in_tier.length; j++) {
          if (
            jump_list.includes(jumps_in_tier[j]) &&
            already_iterated.includes(jumps_in_tier[j]) === false
          ) {
            if (list.includes(jumps_in_tier[j])) {
              buffer += ` - ${jumps_in_tier[j]}\r\n`;
              already_iterated.push(jumps_in_tier[j]);
              count++;
              continue;
            } else {
              already_iterated.push(jumps_in_tier[j]);
              continue;
            }
          }
          updated_jumps_in_tier.splice(
            updated_jumps_in_tier.indexOf(jumps_in_tier[j]),
            1
          );
          did_remove = true;
        }
        if (did_remove) await tiers.set(all_tiers[i], updated_jumps_in_tier);
      }
      await tier_list.set("list", updated_tiers);
      upload(buffer, (link) => {
        message.channel.send(
          `${did_request_id ? "Their" : "Your"} jumps (${count}/${
            jump_list.length
          }): https://paste.ee/r/${link}`
        );
        return;
      });
      break;
    }
    case "missing": {
      let requested_id = message.content.split(`${prefix}tj missing`)[1]
        ? message.content.split(`${prefix}tj missing`)[1].trim()
        : null;
      let did_request_id = requested_id !== null; // did the user ask for someone else's role list?
      if (
        did_request_id &&
        new RegExp(`\\${prefix}tj missing [0-9]{6,20}`, "i").test(
          message.content
        ) === false
      ) {
        message.channel.send(
          `Incorrect command formatting. Usage: \`${prefix}tj missing <optional user ID>\` (without arrows), or list all commands with \`${prefix}commands\`.\r\nMake sure you are using the user's ID instead of mentioning them (https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-).`
        );
        return;
      }
      let list = did_request_id
        ? await user_roles.get(requested_id)
        : author_roles;
      if (!list || list.length === 0) {
        // user has no roles
        message.channel.send(
          `${did_request_id ? "They" : "You"} aren't missing any jumps.`
        );
        return;
      }
      let buffer = `${
        did_request_id ? "Their" : "Your"
      } Missing Roles\r\n=================\r\n\r\n`;
      let updated_tiers = all_tiers; // for removing tiers; will update after for loop
      let already_iterated = []; // jumps already gone over
      let count = 0;
      // iterate over tiers
      for (var i = 0; i < all_tiers.length; i++) {
        let jumps_in_tier = await tiers.get(all_tiers[i]);
        if (inverse_concat(jumps_in_tier, list).length === 0) {
          continue;
        }
        let updated_jumps_in_tier = jumps_in_tier;
        let did_remove = false; // were there any jumps that shouldn't be listed?
        if (!jumps_in_tier || jumps_in_tier.length < 1) {
          updated_tiers.splice(updated_tiers.indexOf(all_tiers[i]), 1);
          continue;
        }
        buffer += `\r\n${all_tiers[i]}\r\n==============\r\n`;
        // iterate over jumps in tier
        for (var j = 0; j < jumps_in_tier.length; j++) {
          if (
            jump_list.includes(jumps_in_tier[j]) &&
            already_iterated.includes(jumps_in_tier[j]) === false
          ) {
            if (list.includes(jumps_in_tier[j]) === false) {
              buffer += ` - ${jumps_in_tier[j]}\r\n`;
              already_iterated.push(jumps_in_tier[j]);
              count++;
              continue;
            } else {
              already_iterated.push(jumps_in_tier[j]);
              continue;
            }
          }
          updated_jumps_in_tier.splice(
            updated_jumps_in_tier.indexOf(jumps_in_tier[j]),
            1
          );
          did_remove = true;
        }
        if (did_remove) await tiers.set(all_tiers[i], updated_jumps_in_tier);
      }
      await tier_list.set("list", updated_tiers);
      upload(buffer, (link) => {
        message.channel.send(
          `${did_request_id ? "Their" : "Your"} missing jumps (${count}/${
            jump_list.length
          }): https://paste.ee/r/${link}`
        );
        return;
      });
      break;
    }
    case "list_all": {
      if (!jump_list || jump_list.length === 0) {
        message.channel.send("No jumps exist (yet).");
        return;
      }
      let buffer = "All Roles\r\n=================\r\n\r\n";
      let updated_tiers = all_tiers; // for removing tiers; will update after for loop
      let already_iterated = []; // jumps already gone over
      let updated_jumps = jump_list;
      let count = 0;
      // iterate over tiers
      for (var i = 0; i < all_tiers.length; i++) {
        let jumps_in_tier = await tiers.get(all_tiers[i]);
        let updated_jumps_in_tier = jumps_in_tier;
        let did_remove = false; // were there any jumps that shouldn't be listed?
        if (!jumps_in_tier || jumps_in_tier.length < 1) {
          updated_tiers.splice(updated_tiers.indexOf(all_tiers[i]), 1);
          continue;
        }
        buffer += `\r\n${all_tiers[i]}\r\n==============\r\n`;
        // iterate over jumps in tier
        for (var j = 0; j < jumps_in_tier.length; j++) {
          if (
            jump_list.includes(jumps_in_tier[j]) &&
            already_iterated.includes(jumps_in_tier[j]) === false
          ) {
            buffer += ` - ${jumps_in_tier[j]}\r\n`;
            already_iterated.push(jumps_in_tier[j]);
            count++;
            continue;
          }
          updated_jumps_in_tier.splice(
            updated_jumps_in_tier.indexOf(jumps_in_tier[j]),
            1
          );
          did_remove = true;
        }
        if (did_remove) await tiers.set(all_tiers[i], updated_jumps_in_tier);
      }
      await tier_list.set("list", updated_tiers);
      upload(buffer, (link) => {
        message.channel.send(
          `All jumps (${count}): https://paste.ee/r/${link}`
        );
        return;
      });
      break;
    }
    case "tier": {
      let name = proper_case(message.content.split(`${prefix}tj tier `)[1]);
      let jumps_in_tier = await tiers.get(name);
      if (jumps_in_tier) {
        upload(
          `All ${name} Jumps\r\n==============\r\n${
            jumps_in_tier.length
          }\r\n\r\n - ${jumps_in_tier.join("\r\n - ")}`,
          function (url) {
            message.channel.send(
              "List of jumps in that tier: " + "https://paste.ee/r/" + url
            );
            return;
          }
        );
      } else {
        message.channel.send("No jumps in that tier exist.");
        return;
      }
      break;
    }
  }
}

module.exports = tj_cmd;
