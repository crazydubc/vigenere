const _ = require('underscore');
//all 275k words in the english language
const words = require('an-array-of-english-words') 

let dictionary = {}
let dictionaryCombinations = {}
 //speed increase over indexOf
_.forEach(words, word => {
    dictionary[word] = true
    for (let i = 1; i < word.length; i++) {
        dictionaryCombinations[word.substring(0,i)] = true;
    }
})

//holds the cypher we want to solve for
const CYPHER = 'Ljgwis jqr kewwzimnq, Wh pudbrem wc wpndy xo hri xowlult cr fipxuh sn cks wtjws sf cks Ynrrb, fuc wvi eehbxs xi serulsv txgoc hjys pem ps xo lkorgn wvssn szenb. Wchah lg e djb tsr vrivnrqu enm usqevesviwj.'
//frequency of letters in the language
const LANGUAGE_LETTER_FREQ = {'a': 0.08167, 'b': 0.01492, 'c': 0.02782, 'd': 0.04253, 'e': 0.12702, 'f': 0.02228,
                        'g': 0.02015, 'h': 0.06094, 'i': 0.06966, 'j': 0.00153, 'k': 0.00772, 'l': 0.04025,
                        'm': 0.02406, 'n': 0.06749, 'o': 0.07507, 'p': 0.01929, 'q': 0.00095, 'r': 0.05987, 's': 0.06327,
                        't': 0.09056, 'u': 0.02758, 'v': 0.00978, 'w': 0.02360, 'x': 0.00150, 'y': 0.01974, 'z': 0.00074}
const COMMON_GRAMS = {2: ["th","he","in","er","an"], 3:["the","and","ing","ion","tio"]} //unused

const charOffset = 'a'.charCodeAt(); //holds first character code, also the offset
const maxCharCode = 'z'.charCodeAt(); //holds last character code

//speed increase table look up. Less math, just a table lookup.
let charCodes = {}
for (let code = charOffset; code <= maxCharCode; code++) { //char numbers for a-z
    const index = String.fromCharCode(code) //get the char
    charCodes[index] = {}; //index it out
    let subdex = code; //start at the header and work through
    for (let i = 0; i < 26; i++) {
        charCodes[index][String.fromCharCode(subdex)] = String.fromCharCode(i+charOffset)
        subdex++
        if (subdex > maxCharCode) {
            subdex = charOffset;
        }
    }
}

//brute force is slow, but works.
class bruteForce {
    constructor(MIN_CIPHER_LENGTH, MAX_CIPHER_LENGTH, cypher) {
        this.MIN_CIPHER_LENGTH = MIN_CIPHER_LENGTH;
        this.MAX_CIPHER_LENGTH = MAX_CIPHER_LENGTH;
        this.cypher = cypher;
    }
    //adds a new char onto an existing key account for a-z
    checkAllCiphersByAddingChar (key) {
        for (let i = charOffset; i <= maxCharCode; i++) {
            const newKey = key + String.fromCharCode(i);
            let canidate;
            if (newKey.length >= this.MIN_CIPHER_LENGTH) {
                count += 1;
                canidate = this.decryptCipherFromKey(newKey);
                if (!canidate) {continue;}
                console.log(newKey)
                if (this.validateWords(canidate.split(' ')) > 0.85) {
                    console.log('Found possible candidate: ' + canidate + ', with cipher ' + newKey + ' at ' + new Date());
                }
            }
            if (newKey.length < this.MAX_CIPHER_LENGTH) {
                this.checkAllCiphersByAddingChar(newKey);
            }
        }
    }

    validateWords(words) {
        console.log((_.filter(words, word => dictionary[word]).length/words.length)+ ' ' + words)
        return _.filter(words, word => dictionary[word]).length/words.length
    }

    decryptCipherFromKey(key) {
        let item = '';
        let index = 0;
        let firstItem = true;
        for (let i = 0; i < this.cypher.length; i++) {
            if (this.cypher[i] === ' ') {
                firstItem = false;
                item += this.cypher[i];
                continue;
            }
            item += charCodes[key[index]][this.cypher[i]];
            if (firstItem && !this.checkSolutionVerseDictionaryCombos(item)) {
                return undefined; //failed the Dictionary root check
            }
            index++;
            if (index >= key.length) {
                index = 0;
                firstItem = false; //no longer potentially the first item
            }
        }
        return item;
    }

    checkSolutionVerseDictionaryCombos(word) {
        return dictionaryCombinations[word]
    }
}
//find the best key based on the length between bigrams and trigrams
class findKeyLength {
    constructor() {
        this.factors = {};
    }
    //find common bigrams and trigrams
    repeatedSequencePosition(text, sequenceLength) {
        let sequencePositions = {};
        for (let t = 0; t < text.length; t++) {
            for (let i = 1; i <= sequenceLength; i++) {
                const end = t+i+1
                if (!text[end]) break;
                const phrase = text.substring(t, end)
                if (sequencePositions[phrase]) {
                    sequencePositions[phrase].push(t);
                } else {
                    sequencePositions[phrase] = [t];
                }
            }
        }
        let repeatedSequences = {}
        for (const index in sequencePositions) {
            if (sequencePositions[index].length > 1) {
                repeatedSequences[index] = sequencePositions[index];
            }
        }
        return  repeatedSequences;
    }
    //find the spacings between bi and trigrams
    getDistances(positions) {
        const spacings = [];
        for (const key in positions) {
            for (let i = 1; i < positions[key].length; i++) {
                spacings.push(positions[key][i]-positions[key][i-1])
            }
        }
        return spacings;
    }
    //pushes a number factor
    pushFactor(number) {
        if (this.factors[number]) {
            this.factors[number] += 1;
        } else {
            this.factors[number] = 1;
        }
    }
    //find factors of a number
    getFactors(number) {
        this.pushFactor(number)
        for (let i = 2; i <= Math.ceil(Math.sqrt(number)+1); i++){
            if (number % i === 0) {
                this.pushFactor(i)
            }
        }
    }
    //finds best factor which is more than likely the key length
    findBestFactor(list) {
        let bestFactor = 0;
        let count = 0;
        for (let i in list) {
            if (list[i] > count || list[i] === count && i > bestFactor) {
                bestFactor = i;
                count = list[i];
            }
        }
        return bestFactor;
    }
    //lets find the key length
    locate(cypher, seqLength, maxKeyLength) {
        cypher = cypher.replace(/\s/g, ''); //remove spaces
        console.log(cypher)
        const reaptedKeySequences = this.repeatedSequencePosition(cypher, 2);
        const distances = this.getDistances(reaptedKeySequences);
        _.forEach(distances, d => this.getFactors(d));
        const keyLength = this.findBestFactor(this.factors)
        console.log('Found key length ' + keyLength);
        return keyLength
    }
}
//finds the cypherkey based on bigrams and trigrams
class findCypherKey {
    constructor(cypher) {
        this.cypher = cypher;
        this.keyLengthFinder = new findKeyLength();
    }
    //break letters into columns
    getColumns() {
        this.columns = [];
        const formattedCypher = this.cypher.replace(/\s/g, '')
        for (let i = 0; i < this.keyLength; i++) {
            this.columns[i] = []
            for (let j = i; j < formattedCypher.length; j = +j + +this.keyLength) {
                if (formattedCypher[j]) this.columns[i].push(formattedCypher[j])
            }
        }
    }
    getLetterFrequencies(text) {
        let freqs = {};
        for (const letter of text) {
            freqs[letter] = freqs[letter] ? freqs[letter] + 1 : 1;
        }
        return freqs
    }
    getShiftedCharacter(startingLetter, offset) {
        offset = _.isNumber(offset) ? offset : offset.charCodeAt()-charOffset; //normalize to a number if a string is passed.
        let newCharCode = startingLetter.charCodeAt()- offset
        if (newCharCode < charOffset) {
            newCharCode += 26;
        }
        return String.fromCharCode(newCharCode)
    }
    getBestKeysByColumn(column) {
        let bestLetters = [];
        let bestSum = 0;
        const freqs = this.getLetterFrequencies(column)
        for (const l in LANGUAGE_LETTER_FREQ) {
            //console.log('Checking ' + l)
            let weight = 0;
            for (const letter in freqs){
                const newChar = this.getShiftedCharacter(letter, l)
                weight += LANGUAGE_LETTER_FREQ[newChar]*freqs[letter]
            }
            bestLetters.push([l, weight]);

        }
        bestLetters.sort(function(a, b) { return b[1] - a[1] });
        while (bestLetters.length > 3) {
            bestLetters.pop();
        }
        //console.log(JSON.stringify(bestLetters))
        let letters = []
        for (const l in bestLetters) {
            letters.push(bestLetters[l][0])
        }
        return letters;
    }
    allPossibleCombinations(keys) {
        if (keys.length === 0) return [];
        if (keys.length === 1) return keys[0];
        let result = []
        const allOthers = this.allPossibleCombinations(keys.slice(1));
        _.forEach(allOthers, c => {
            _.forEach(keys[0], key => result.push(key + c))
        })
        return result;
    }
    decryptKey(key){ 
        let item = '';
        let index = 0;
        for (let i = 0; i < this.cypher.length; i++) {
            if (this.cypher[i] === ' ') {
                item += this.cypher[i];
            } else {
                item += charCodes[key[index]][this.cypher[i]];
                index++;
                if (index >= key.length) {
                    index = 0;
                }
            }
        }
        return item;
    }
    checkSolutionVerseDictionaryCombos(word) {
        return dictionaryCombinations[word]
    }
    decryptAndRateKey(key) {
        const decrypted = this.decryptKey(key);
        let rating = 0;
        const words = decrypted.split(' ');
        for (const word of words) {
            if (this.checkSolutionVerseDictionaryCombos(word)) {
                rating += 1;
            }
        }
        rating = rating/words.length;
        return {key, decrypted, rating};
    }
    findBestKeys(keys) {
        const allPossKeys = this.allPossibleCombinations(keys);
        let keyResults = [];
        _.forEach(allPossKeys, key => keyResults.push(this.decryptAndRateKey(key)));
        keyResults = keyResults.sort(function(a, b) { return b.rating - a.rating })
        while( keyResults.length > 5) {
            keyResults.pop()
        }
        return keyResults;
    }
    run () {
        this.keyLength = this.keyLengthFinder.locate(this.cypher, 2, 10);
        this.getColumns();
        let key = ''
        this.getBestKeysByColumn(this.columns[0])
        let keys = [];
        _.forEach(this.columns, column => { //get the top 3 keys for the column
            keys.push(this.getBestKeysByColumn(column));
        })
        const bestKeys = this.findBestKeys(keys)
        if (bestKeys[0].rating < 0.5) return false;
        for (const entry of bestKeys) {
            console.log('Found canidate ' + entry.key + ' with a rating of ' + (entry.rating*100) + '% with result: ' + entry.decrypted)
        }
        return true
    }
}


//run the logic
const d = new Date();
const n = d.getTime();
console.log('Decode started at ' +  d + '.');
let count = 0;

const cypher = CYPHER.replace(/[^a-zA-Z ]/g, "").toLowerCase();; //remove special characters and convert to lowercase..just in case

const keyFinder = new findCypherKey(cypher);
if (!keyFinder.run()) {
    console.log('Failed to solve via trigrams and bigrams, brute forcing...')
    const bruteForceCracker = new bruteForce(1, 8, cypher);
    bruteForceCracker.checkAllCiphersByAddingChar('ajd');
}


const d1 = new Date();
const n1 = d1.getTime();

const totalTime = n1 - n;
console.log('Decode ended at ' +  d1 + '.');
console.log('After running ' + count + ' checks.');
console.log('Total Time ' + Math.round(totalTime/ (1000*60)) + ' minutes.');
