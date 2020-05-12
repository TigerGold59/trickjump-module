const uppercase_words = [
  "frs",
  "zg"
];
function proper_case(str) {
  // "example phrase" to "Example Phrase" excluding words and, to, of
  let words = str.split(" ");
  for (var i = 0; i < words.length; i++) {
    let word = words[i].split("");
    if (/[0-9][a-zA-Z]+/.test(words[i])) {
      word = word.map(x => x.toUpperCase());
    }
    else if (uppercase_words.includes(words[i])) {
      word = word.map(x => x.toUpperCase());
    }
    else if (
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
    ) {
      word = word.map(x => x.toLowerCase());
      word[0] = word[0].toUpperCase();
    }
    for (var j = 0; j < word.length; j++) {
      if (word[j] === "’") word[j] = "'";
    }
    words[i] = word.join("");
  }
  return words.join(" ");
}
module.exports = proper_case;
