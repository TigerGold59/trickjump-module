function proper_case(str) {
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
async function proof_cmd(message, client, Discord, prefix) {
  // %proof set | <jump name> | <link>
  // %proof list
  // %proof list_user <user_id>
  // %proof get | <jump name> | <optional user ID>
  const kv = require("keyv")
  const proof_db = new kv("sqlite://modules/trickjump/dbs/proof.db")
  const jumps_db = new kv("sqlite://modules/trickjump/dbs/jumps.db")
  const roles_db = new kv("sqlite://modules/trickjump/dbs/roles.db")
  const proof_regexp = /^https:\/\/twitter\.com\/\S+\/status\/[0-9]{10,}\/?(?:\?s=[0-9]{0,2})?$/;
  const upload = require("../../../upload_to_pastebin.js")
  let args = message.content.split(" "); args.shift();
  if (args.length < 1) {
    message.channel.send("Invalid usage. Please use " + prefix + "commands to see the correct usage.")
    return;
  }
  switch (args[0]) {
    case "set":
      let jump_name = proper_case(message.content.split(" | ")[1]);
      let link = message.content.split(" | ")[2];
      let jumps_list = await jumps_db.get("jump_list")
      let user_jumps = await roles_db.get(message.author.id)
      if (jumps_list.includes(jump_name) === false) {
        message.channel.send("That jump doesn't exist. Check if you made a typo or list all jumps with \"" + prefix + "tj list_all\".")
        return;
      }
      else if (user_jumps.includes(jump_name) == false) {
        message.channel.send("You don't have that jump. Check if you made a typo or list all your jumps with \"" + prefix + "tj list\".")
        return;
      }
      else {
        let user_proofs = await proof_db.get(String(message.author.id));
        if (!user_proofs) {
          if (proof_regexp.test(link)) {
            proof_db.set(String(message.author.id), {[jump_name]: link})
            message.channel.send("Your proof has been set.")
            return;
          }
          else {
            message.channel.send("The proof you supplied is not a valid link to a Tweet. Try removing the \"?s=<number>\" at the end of the link.")
            return;
          }
        }
        else if (!user_proofs[jump_name]) {
          if (proof_regexp.test(link)) {
            user_proofs[jump_name] = link;
            proof_db.set(String(message.author.id), user_proofs);
            message.channel.send("Your proof has been set.")
            return;
          }
          else {
            message.channel.send("The proof you supplied is not a valid link to a Tweet.")
            return;
          }
        }
        else {
          if (proof_regexp.test(link)) {
            user_proofs[jump_name] = link;
            proof_db.set(String(message.author.id), user_proofs);
            message.channel.send("Your proof has been changed.")
            return;
          }
          else {
            message.channel.send("The proof you supplied is not a valid link to a Tweet.")
            return;
          }
        }
      }
      break;
    case "list":
      let proof = await proof_db.get(message.author.id)
      let user_jumproles = await roles_db.get(message.author.id)
      if (!proof) {
        message.channel.send("You have no proof listed.")
      }
      else {
        let buffer = `Your List of Proof\r\n=======================\r\nYou have proof for ${Object.keys(proof).length} jump(s) out of ${user_jumproles.length} total roles\r\n`
        var new_proof = proof;
        for (jump in proof) {
          if (user_jumproles.includes(jump) === false) {
            delete new_proof[jump]
            require("../../../log.js")("1 invalid proof deleted on list check from " + message.author.id)
            continue;
          }
          buffer += "\r\n - " + jump + ": " + proof[jump];
        }
        proof_db.set(message.author.id, new_proof);
        upload(buffer, function (url) {
          message.channel.send("Here is your list of proof for jumps: " + "https://paste.ee/r/" + url)
        })
      }
      break;
    case "list_user":
      let proof_user = await proof_db.get(message.content.split(prefix + "proof list_user ")[1])
      let user_roles = await roles_db.get(message.content.split(prefix + "proof list_user ")[1])
      if (!proof_user) {
        message.channel.send("That user has no proof listed.")
      }
      else {
        let buffer = `List of Proof\r\n=======================\r\nProof for ${Object.keys(proof_user).length} jump(s) out of ${user_roles.length} total roles\r\n`
        let new_proof = proof_user;
        for (jump in proof_user) {
          if (user_roles.includes(jump) === false) {
            delete new_proof[jump]
            continue;
          }
          buffer += "\r\n - " + jump + ": " + proof_user[jump];
        }
        proof_db.set(message.content.split(prefix + "proof list_user ")[1], new_proof);
        upload(buffer, function (url) {
          message.channel.send("Here is the list of proof for the user: " + "https://paste.ee/r/" + url)
        })
      }
      break;
    case "get":
      if (message.content.split(" | ").length > 3) {
        message.channel.send("Incorrect formatting of the command. Please use " + prefix + "commands for the correct usage.")
      }
      let jump_id = proper_case(message.content.split(" | ")[1]);
      let user_id = message.content.split(" | ")[2]
      if (!user_id) {
        let proof_list = await proof_db.get(String(message.author.id))
        let user_jump_list = await roles_db.get(message.author.id)
        if (user_jump_list.includes(jump_id) === false) {
          if (Object.keys(proof_list).includes(jump_id)) {
            let new_proof = proof_list;
            delete new_proof[jump_id];
            proof_db.set(user_id, new_proof)
          }
          message.channel.send("You do not have that jump, so no proof is attainable.")
        }
        else {
          if (proof_list[jump_id]) {
            message.channel.send("Your link to the proof for " + jump_id + ": " + proof_list[jump_id])
          }
          else {
            message.channel.send("You don't have proof for that jump.")
          }
        }
      }
      else {
        let proof_list = await proof_db.get(user_id)
        let user_jump_list = await roles_db.get(user_id)
        if (user_jump_list.includes(jump_id) === false) {
          if (Object.keys(proof_list).includes(jump_id)) {
            let new_proof = proof_list;
            delete new_proof[jump_id];
            proof_db.set(user_id, new_proof)
          }
          message.channel.send("That user doesn't have the specified jump as a role.")
        }
        else {
          if (proof_list[jump_id]) {
            message.channel.send("Your link to the proof for " + jump_id + ": " + proof_list[jump_id])
          }
          else {
            message.channel.send("You don't have proof for that jump.")
          }
        }
      }
  }
}
module.exports = proof_cmd
