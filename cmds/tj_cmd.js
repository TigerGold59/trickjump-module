function proper_case(str) { // "example phrase" to "Example Phrase" excluding words and, to, of
  let words = str.split(" ");
  for (var i = 0; i < words.length; i++) {
    let word = words[i].split("");
    if ((word.join("") === "to" || word.join("") === "and" || word.join("") === "of") === false) {
      word[0] = word[0].toUpperCase();
    }
    words[i] = word.join("");
  }
  return words.join(" ");
}
async function tj_cmd(message, client, Discord, prefix) {
  // Usage: tj <info/give/remove>
  let args = message.content.split(" ");
  args.shift(); // removes command from argument list
  const kv = require("keyv");
  const jumps = new kv("sqlite://modules/trickjump/dbs/jumps.db");
  const tiers = new kv("sqlite://modules/trickjump/dbs/jumps.db", {namespace: "tiers"});
  const user_roles = new kv("sqlite://modules/trickjump/dbs/roles.db");
  const tier_list = new kv("sqlite://modules/trickjump/dbs/tier-list.db")
  const upload = require("../../../upload_to_pastebin.js")
  function inverse_concat(arr1, arr2) {
    let result = []
    for (var i = 0; i < arr1.length; i++) {
      if (arr2.includes(arr1[i]) === false) {
        result.push(arr1[i]);
      }
    }
    return result;
  }
  switch (args[0]) {
    case "info":
      let to_split = prefix + "tj info ";
      let exists_arr = await jumps.get("jump_list"); // All jumps
      if (exists_arr.includes(proper_case(message.content.split(to_split)[1])) === false) { // Check if jump exists so we don't get weird errors
        message.channel.send("That jump doesn't exist. Check for typos.");
      }
      else {
        jump_info = await jumps.get(proper_case(message.content.split(to_split)[1]))
        message.channel.send(jump_info.output + "\r\n\r\n Tier: " + jump_info.tier);
      }
      break;
    case "give":
      jumps.get("jump_list").then(list => {
        if (!list.includes(proper_case(message.content.split(prefix + "tj give ")[1]))) {
          message.channel.send("That role doesn't exist.")
        }
        else {
          user_roles.get(message.author.id).then(roles => {
            if (!roles) {
              let list = [proper_case(message.content.split(prefix + "tj give ")[1])];
			  if (message.guild.member(message.author).roles.get('576550505275457557')) {
                try {
                  message.guild.member(message.author).setNickname(require("../auto_name.js")(true, message.guild.member(message.author).nickname))
                }
                catch (err) {
                  console.log(err)
                }
              }
              message.channel.send("Gave you the role.")
              user_roles.set(message.author.id, list);
            }
            else if (!(roles.includes(proper_case(message.content.split(prefix + "tj give ")[1])))) {
              let list = roles;
              if (message.guild.member(message.author).roles.get('576550505275457557')) {
                try {
                  message.guild.member(message.author).setNickname(require("../auto_name.js")(true, message.guild.member(message.author).nickname))
                }
                catch (err) {
                  console.log(err)
                }
              }
              list.push(proper_case(message.content.split(prefix + "tj give ")[1]));
              message.channel.send("Gave you the role.")
              user_roles.set(message.author.id, list);
            }
            else {
              message.channel.send("You already have that role.");
            }
          });
        }
      })
      break;
    case "give_all":
        var all = await jumps.get("jump_list")
        user_roles.set(message.author.id, all);
        message.channel.send("Gave you all roles.")
        break;
    case "remove_all":
        user_roles.set(message.author.id, []);
        message.channel.send("Took away all your roles.")
        break;
    case "remove":
      if (user_roles.get(message.author.id) === undefined) {
        return false;
        message.channel.send("You don't have any roles.");
      }
      user_roles.get(message.author.id).then(list => {
        // Removes element from jump_list, if it exists
        let jump_list = list
        let index = list.indexOf(proper_case(message.content.split(prefix + "tj remove ")[1]));
        if (index > -1) {
          message.channel.send("Removed the role from your list.")
          jump_list.splice(index, 1);
        }
        else {
          message.channel.send("You don't have that role.")
        }
        if (message.guild.member(message.author).roles.get('634764145765515274')) {
          try {
            message.guild.member(message.author).setNickname(require("../auto_name.js")(false, message.guild.member(message.author).nickname))
          }
          catch (err) {
            console.log(err)
          }
        }
        user_roles.set(message.author.id, jump_list)
      });
      break;
    case "tier":
      let tier = message.content.split(prefix + "tj tier ")[1];
      tiers.get(tier).then(list => {
        if (list) {
          upload(list.length + "\r\n\r\n - " + list.join("\r\n - "), function(url) {
            message.channel.send("List of jumps in that tier: " + "https://paste.ee/r/" + url);
          })
        }
        else {
          message.channel.send("No jumps in that tier exist.")
        }
      })
      break;
    case "list":
      if (message.content.split(prefix + "tj list ")[1]) {
        user_roles.get(message.content.split(prefix + "tj list ")[1]).then(async function (jump_list){
          // Join with dashes and newlines and then upload to hastebin and send link to hastebin, if there are any elements
          if (!jump_list) {
            message.channel.send("They do not have any roles or they do not exist.");
          }
          else {
            var all_jumps = await jumps.get("jump_list")
            var total_count = all_jumps.length;
            var count = jump_list.length;
            var buffer = "Their Jumps\r\n=================================\r\n" + count + "/" + total_count
            buffer += "\r\n - " + jump_list.join("\r\n - ")
            upload(buffer, function(url) {
              message.channel.send("List of roles that user has: " + "https://paste.ee/r/" + url);
            })
          }
        })
      }
      else {
        user_roles.get(message.author.id).then(async function (jump_list){
          // Join with dashes and newlines and then upload to hastebin and send link to hastebin, if there are any elements
          if (!jump_list) {
            message.channel.send("You do not have any roles.");
          }
          else {
            var all_jumps = await jumps.get("jump_list")
            var total_count = all_jumps.length;
            var count = jump_list.length;
            var buffer = "Your Jumps\r\n=================================\r\n" + count + "/" + total_count
            buffer += "\r\n - " + jump_list.join("\r\n - ")
            upload(buffer, function(url) {
              message.channel.send("List of roles you have: " + "https://paste.ee/r/" + url);
            })
          }
        })
      }
      break;
    case "list_all":
      let jump_list = await jumps.get("jump_list")
        // Join with dashes and newlines and then upload to hastebin and send link to hastebin, if there are any elements
      if (jump_list.length === 0) {
        message.channel.send("No jumps exist.");
      }
      else {
        let all_tiers = await tier_list.get("list")
        let buffer = "ALL ROLES\r\n=================\r\n\r\n\r\n"
        let count = 0;
        for (var i = 0; i < all_tiers.length; i++) {
          let current_jumps = await tiers.get(all_tiers[i])
          if (current_jumps.length === 0) {
            all_tiers.splice(all_tiers.indexOf(all_tiers[i]), 1)
            tier_list.set("list", all_tiers)
          }
          else {
            buffer += all_tiers[i] + "\r\n==============\r\n"
            for (var j = 0; j < current_jumps.length; j++) {
              if (jump_list.includes(current_jumps[j])) {
                buffer += current_jumps[j] + "\r\n"
                count++;
              }
              else {
                current_jumps.splice(current_jumps.indexOf(current_jumps[i]), 1)
                tiers.set(all_tiers[i], current_jumps)
              }
            }
            buffer += "\r\n\r\n"
          }
        }
        upload(buffer, link => {
          message.channel.send(`All jumps (${count}): ` + "https://paste.ee/r/" + link);
        })
      }
      break;
    case "missing":
      let all_jumps = await jumps.get("jump_list");
      var has = await user_roles.get(message.author.id);
      all_jumps = inverse_concat(all_jumps, has);
        // Join with dashes and newlines and then upload to hastebin and send link to hastebin, if there are any elements
      if (all_jumps.length === 0) {
        message.channel.send("No jumps exist or you are missing no jumps.");
      }
      else {
        let all_tiers = await tier_list.get("list")
        let buffer = "MISSING ROLES\r\n=================\r\n\r\n\r\n"
        let count = 0;
        for (var i = 0; i < all_tiers.length; i++) {
          let current_jumps = await tiers.get(all_tiers[i])
          if (current_jumps.length === 0) {
            all_tiers.splice(all_tiers.indexOf(all_tiers[i]), 1)
            tier_list.set("list", all_tiers)
          }
          else if (inverse_concat(current_jumps, has).length === 0) {
            continue;
          }
          else {
            current_jumps = inverse_concat(current_jumps, has)
            if (!current_jumps) {
              continue;
            }
            buffer += all_tiers[i] + "\r\n==============\r\n"
            for (var j = 0; j < current_jumps.length; j++) {
              if (all_jumps.includes(current_jumps[j])) {
                buffer += current_jumps[j] + "\r\n"
                count++;
              }
            }
            buffer += "\r\n\r\n"
          }
        }
        upload(buffer, link => {
          message.channel.send(`Jumps you're missing (${count}): ` + "https://paste.ee/r/" + link);
        })
      }
      break;
    default:
      message.channel.send(`Invalid usage. Use ${prefix}commands for usage.`)
      break;
  }
}
module.exports = tj_cmd;
