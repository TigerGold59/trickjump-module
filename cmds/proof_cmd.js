const proper_case = require("../auto_case.js");

function inverse_concat(arr1, arr2) {
  let result = [];
  for (var i = 0; i < arr1.length; i++) {
    if (arr2.includes(arr1[i]) === false) {
      result.push(arr1[i]);
    }
  }
  return result;
}

async function proof_cmd(message, client, Discord, prefix) {
  // %proof set | <jump name> | <link>
  // %proof list
  // %proof list_user <user_id>
  // %proof get | <jump name> | <optional user ID>
  const kv = require("keyv");
  const proof = new kv("sqlite://modules/trickjump/dbs/proof.db");
  var author_proof = await proof.get(message.author.id);
  const jumps = new kv("sqlite://modules/trickjump/dbs/jumps.db");
  var jump_list = await jumps.get("jump_list");
  const user_roles = new kv("sqlite://modules/trickjump/dbs/roles.db");
  var author_roles = await user_roles.get(message.author.id);
  const tiers = new kv("sqlite://modules/trickjump/dbs/jumps.db", {
    namespace: "tiers",
  });
  const tier_list = new kv("sqlite://modules/trickjump/dbs/tier-list.db");
  var all_tiers = await tier_list.get("list");
  const proof_regexp = /^https:\/\/twitter\.com\/\S+\/status\/[0-9]{10,}\/?(?:\?s=[0-9]{0,2})?$/i;
  const upload = require("../../../upload_to_pastebin.js");
  var args = message.content.split(" ");
  args.shift(); // delete command from args list
  if (args.length < 1) {
    message.channel.send(
      `Incorrect command formatting. You can see the correct usage by listing all commands with \`${prefix}commands\`.`
    );
    return;
  }

  switch (args[0]) {
    case "set": {
      // %proof set | name | link
      let new_args = message.content
        .split("|")
        .map((x) => proper_case(x.trim()));
      let name = new_args[1];
      let link = new_args[2];
      if (jump_list.includes(name) === false) {
        // jump doesn't exist
        message.channel.send(
          `That jump doesn't exist. Check for typos or list all jumps with  \`${prefix}tj list_all\`.`
        );
        return;
      } else if (!author_roles || author_roles.includes(name) == false) {
        // can't set proof for a jump you don't have
        message.channel.send(
          "You don't have that jump. Check if you made a typo or list all your jumps with \"" +
            prefix +
            'tj list".'
        );
        return;
      } else if (proof_regexp.test(link) === false) {
        // invalid link
        message.channel.send(
          "The proof you supplied is not a valid link to a tweet. Make sure the tweet is a `twitter.com` link that includes the `https://` at the start."
        );
        return;
      } else {
        if (!author_proof) {
          // user has no proof yet
          await proof.set(message.author.id, {
            [name]: link.replace(/\?s=[0-9]{0,2}/gi, ""),
          });
          await message.react("✅");
          return;
        } else if (!author_proof[name]) {
          // user has no proof for this role yet
          author_proof[name] = link.replace(/\?s=[0-9]{0,2}/gi, "");
          await proof.set(message.author.id, author_proof);
          await message.react("✅");
          return;
        } else if (
          author_proof[name] === link.replace(/\?s=[0-9]{0,2}/gi, "")
        ) {
          // user already has the same proof
          message.channel.send("That is already your proof for that jump.");
          return;
        } else {
          // user already has proof but it's different
          author_proof[name] = link.replace(/\?s=[0-9]{0,2}/gi, "");
          await proof.set(message.author.id, author_proof);
          await message.react("✅");
          return;
        }
      }
      break;
    }
    case "get": {
      // %proof get | name | user
      if (
        message.content.split("|").length < 2 ||
        message.content.split("|").length > 3
      ) {
        message.channel.send(
          "Incorrect formatting of the command. Please use " +
            prefix +
            "commands for the correct usage."
        );
        return;
      }
      let name = proper_case(message.content.split("|")[1].trim());
      let requested_id = message.content.split(`|`)[2]
        ? message.content.split(`|`)[2].trim()
        : null;
      let did_request_id = requested_id !== null; // did the user ask for someone else's role list?
      if (
        did_request_id &&
        new RegExp(`\\${prefix}proof get \| ?\S+ ?\| ?[0-9]{6,20}`, "i").test(
          message.content
        ) === false
      ) {
        message.channel.send(
          `Incorrect command formatting. Usage: \`${prefix}proof get | <jump name> | <optional user ID>\` (without arrows), or list all commands with \`${prefix}commands\`.\r\nMake sure you are using the user's ID instead of mentioning them (https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-).`
        );
        return;
      }
      let requested_proof = did_request_id
        ? await proof.get(requested_id)
        : author_proof;
      let requested_roles = did_request_id
        ? await user_roles.get(requested_id)
        : author_roles;
      if (requested_roles.includes(name) === false) {
        if (Object.keys(requested_proof).includes(name) === false) {
          delete requested_proof[name];
          await proof.set(
            did_request_id ? requested_id : message.author.id,
            requested_proof
          );
        }
        message.channel.send(
          `${
            did_request_id ? "They" : "You"
          } don't have that jump. Check for typos or list ${
            did_request_id ? "their" : "your"
          } jumps with \`${prefix}tj list${
            did_request_id ? " " + requested_id : ""
          }\`.`
        );
        return;
      } else if (requested_proof && requested_proof[name]) {
        message.channel.send(
          `Link to ${
            did_request_id ? "their" : "your"
          } proof for ${name}: ${requested_proof[name]
            .trim()
			.toLowerCase()
            .replace(/\?s=[0-9]{0,2}/gi, "")}`
        );
        return;
      } else {
        message.channel.send(
          `${
            did_request_id ? "They" : "You"
          } don't have proof listed for that jump.`
        );
        return;
      }
      break;
    }
    case "list": {
      let requested_id = message.content.split(`${prefix}proof list `)[1]
        ? message.content.split(`${prefix}proof list`)[1].trim()
        : null;
      let did_request_id = requested_id !== null; // did the user ask for someone else's role list?
      if (
        did_request_id &&
        new RegExp(`\\${prefix}proof list [0-9]{6,20}`, "i").test(
          message.content
        ) === false
      ) {
        message.channel.send(
          `Incorrect command formatting. Usage: \`${prefix}proof list <optional user ID>\` (without arrows), or list all commands with \`${prefix}commands\`.\r\nMake sure you are using the user's ID instead of mentioning them (https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-).`
        );
        return;
      }
      let requested_proof = did_request_id
        ? await proof.get(requested_id)
        : author_proof;
      let requested_roles = did_request_id
        ? await user_roles.get(requested_id)
        : author_roles;
      if (!requested_proof || requested_proof === {}) {
        message.channel.send(
          `${did_request_id ? "They" : "You"} have no proof listed.`
        );
        return;
      } else {
        let buffer = "";
        let count = 0;
        for (jump in requested_proof) {
          if (
            requested_roles.includes(jump) === false ||
            jump_list.includes(jump) === false
          ) {
            delete requested_proof[jump];
            continue;
          }
          buffer += `\r\n - ${jump}: ${requested_proof[jump]
            .trim()
            .toLowerCase()
            .replace(/\?s=[0-9]{0,2}/gi, "")}`;
          count++;
        }
        await proof.set(requested_id, requested_proof);
        if (count === 0) {
          message.channel.send(
            `${did_request_id ? "They" : "You"} have no proof listed.`
          );
          return;
        }
        upload(
          `${
            did_request_id ? "Their" : "Your"
          } List of Proof\r\n=======================\r\n${
            did_request_id ? "They" : " You"
          } have proof for ${count} jump(s) out of ${
            author_roles.length
          } total roles\r\n` + buffer,
          function (url) {
            message.channel.send(
              `List of proof ${
                did_request_id ? "they" : "you"
              } have: https://paste.ee/r/${url}`
            );
          }
        );
      }
      break;
    }
    case "missing": {
      let requested_id = message.content.split(`${prefix}proof missing`)[1]
        ? message.content.split(`${prefix}proof missing`)[1].trim()
        : null;
      let did_request_id = requested_id !== null; // did the user ask for someone else's missing proof list?
      if (
        did_request_id &&
        new RegExp(`\\${prefix}proof missing [0-9]{6,20}`, "i").test(
          message.content
        ) === false
      ) {
        message.channel.send(
          `Incorrect command formatting. Usage: \`${prefix}tj missing <optional user ID>\` (without arrows), or list all commands with \`${prefix}commands\`.\r\nMake sure you are using the user's ID instead of mentioning them (https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-).`
        );
        return;
      }
      let list = did_request_id
        ? await Object.keys(proof.get(requested_id))
        : Object.keys(author_proof);
      let requested_roles = did_request_id
        ? await user_roles.get(requested_id)
        : Object.keys(author_roles);
      if (!list || list.length === 0) {
        // user has no roles
        message.channel.send(
          `${did_request_id ? "They" : "You"} don't have any proof listed.`
        );
        return;
      }
      let buffer = `${
        did_request_id ? "Their" : "Your"
      } Missing Proof\r\n=================\r\n\r\n`;
      let updated_tiers = all_tiers; // for removing tiers; will update after for loop
      let already_iterated = []; // jumps already gone over
      let count = 0;
      // iterate over tiers
      for (var i = 0; i < all_tiers.length; i++) {
        let jumps_in_tier = await tiers.get(all_tiers[i]);
        if (
          inverse_concat(inverse_concat(requested_roles, jumps_in_tier), list)
            .length === 0
        ) {
          continue;
        }
        if (!jumps_in_tier || jumps_in_tier.length < 1) {
          updated_tiers.splice(updated_tiers.indexOf(all_tiers[idea]), 1);
          continue;
        }
        buffer += `\r\n${all_tiers[i]}\r\n==============\r\n`;
        // iterate over jumps in tier
        for (var j = 0; j < jumps_in_tier.length; j++) {
          if (
            jump_list.includes(jumps_in_tier[j]) &&
            already_iterated.includes(jumps_in_tier[j]) === false
          ) {
            if (
              list.includes(jumps_in_tier[j]) === false &&
              requested_roles.includes(jumps_in_tier[j])
            ) {
              buffer += ` - ${jumps_in_tier[j]}\r\n`;
              already_iterated.push(jumps_in_tier[j]);
              count++;
              continue;
            } else {
              already_iterated.push(jumps_in_tier[j]);
              continue;
            }
          }
        }
      }
      if (count === 0) {
        message.channel.send(
          `${did_request_id ? "They" : "You"} have proof for all ${
            did_request_id ? "their" : "your"
          } jumps.`
        );
        return;
      }
      upload(buffer, (link) => {
        message.channel.send(
          `${did_request_id ? "Their" : "Your"} missing proof (${count}/${
            requested_roles.length
          } possessed jumps): https://paste.ee/r/${link}`
        );
        return;
      });
      break;
    }
    case "remove": {
      // %proof remove <name>
      let name = message.content.split(`${prefix}proof remove `)[1]
        ? message.content.split(`${prefix}proof remove`)[1].trim()
        : null;
      if (jump_list.includes(name) === false) {
        // jump doesn't exist
        message.channel.send(
          `That jump doesn't exist. Check for typos or list all jumps with  \`${prefix}tj list_all\`.`
        );
        return;
      } else if (author_roles.includes(name) == false) {
        // can't set proof for a jump you don't have
        message.channel.send(
          "You don't have that jump. Check if you made a typo or list all your jumps with \"" +
            prefix +
            'tj list".'
        );
        return;
      } else {
        if (!author_proof) {
          // user has no proof yet
          message.channel.send("You have no proof listed.");
          return;
        } else if (!author_proof[name]) {
          message.channel.send("You have no proof for that jump listed.");
          return;
        } else {
          // user already has proof but it's different
          delete author_proof[name];
          await proof.set(message.author.id, author_proof);
          await message.react("✅");
          return;
        }
      }
      break;
    }
    default: {
      return message.channel.send(
        `Incorrect command formatting. You can see the correct usage by listing all commands with \`${prefix}commands\`.`
      );
    }
  }
}

module.exports = proof_cmd;
