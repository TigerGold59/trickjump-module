"use strict";
const module_obj = {
  "restrictions": {
    "servers": {
      "whitelist": ["469869605570084886", "specific"]
    }
  },
  "functions": {
    "jumprole": require("./cmds/jumprole_cmd.js"),
    "tj": require("./cmds/tj_cmd.js"),
    "proof": require("./cmds/proof_cmd.js")
  },
  "cmd_manual": {
    "jumprole <set/remove>": "\r\n   set: jumprole set | <jump name> | <tier name> | <info command output> - creates or replaces the role\r\n   remove: jumprole remove <jump name> - deletes the role, but not from everybody's role list",
    "tj <info/give/give_all/remove/remove_absolute/remove_all/tier/list/list_all/missing>": "\r\n   info: tj info <jump name> - gives info command result for that role\r\n   give: tj give <jump name> - gives you the role\r\n   give_all: tj give_all - gives you all the roles\r\n   remove: tj remove <jump name> - removes the role from you\r\n   remove_absolute: tj remove_absolute <jump name> - removes the role from you exactly the way you typed it\r\n   remove_all: tj remove_all - removes all your roles\r\n   tier: tj tier <tier name> - sends a list of jumps in that tier\r\n   list: tj list <optional user ID> - lists all the roles you (or the user whose ID you included) have\r\n   list_all: tj list_all - lists all the roles that exist\r\n   missing: tj missing <optional user ID> - lists all the roles that you (or the user whose ID you included) are missing",
    "proof <set/get/list/list_user/missing>": "\r\n   set: proof set | <jump name> | <Twitter.com link> - sets your proof for that jump\r\n   get: proof get | <jump name> | <optional user ID> - sends the proof linked for you or the user whose ID you included\r\n   list: proof list - lists all your proof you have set\r\n   list_user: proof list_user <user ID> - lists all the proof of the user whose ID you included\r\n   missing: proof missing <optional user ID> - lists all the proof missing from you or the user whose ID you included"
  }
}
module.exports = module_obj;
