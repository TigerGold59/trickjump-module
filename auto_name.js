function auto_name(add, nickname) {
  // Nickname format:
  // <name> [number/number]
  // add: if true, add a role, if false, subtract a role
  let [name, number, total] = [nickname.split(" [")[0], nickname.split(" [")[1].split("/")[0], nickname.split(" [")[1].split("/")[1].split("]")[0]];
  if (add) {
    return `${name} [${Number(number) + 1}/${total}]`;
  }
  else {
    return `${name} [${Number(number) - 1}/${total}]`;
  }
}
module.exports = auto_name;
