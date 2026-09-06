/*
 * Do Now problem/prompt banks
 * Extracted from src/App.jsx so the content banks can grow without
 * bloating the app shell. Shapes are unchanged.
 */

export const DO_NOW_MATH = {
  "K–2": [
    { title:"Count and Compare", problem:"Which is greater: 14 or 17? How do you know?", hint:"Use a number line or count forward from 14.", answer:"17 is greater because it comes after 14 when counting.", teacherNote:"Listen for students using order, counting, or place-value language." },
    { title:"Missing Addend", problem:"5 + ___ = 9. What number is missing?", hint:"Count up from 5 to 9.", answer:"4 is missing because 5 + 4 = 9.", teacherNote:"Ask students to show the count-up strategy on fingers or drawings." },
    { title:"Shape Hunt", problem:"Name a shape with 3 sides. Where do you see one in the room?", hint:"Count the sides and corners.", answer:"A triangle has 3 sides.", teacherNote:"Accept real-world examples if students can justify the shape." },
    { title:"Ten Frame Think", problem:"You have 8 counters. How many more do you need to make 10?", hint:"Think 8 and what makes 10?", answer:"2 more counters make 10.", teacherNote:"Connect to complements of ten." }
  ],
  "3–5": [
    { title:"Fraction Match", problem:"Which is larger: 1/2 or 3/8? Explain your reasoning.", hint:"Compare both fractions to 4/8.", answer:"1/2 is larger because 1/2 = 4/8, and 4/8 > 3/8.", teacherNote:"Look for equivalent fraction reasoning, not just an answer." },
    { title:"Place Value Puzzle", problem:"A number has 6 hundreds, 4 tens, and 9 ones. What is the number?", hint:"Write the hundreds, tens, and ones in order.", answer:"649.", teacherNote:"Ask students to represent it in expanded form: 600 + 40 + 9." },
    { title:"Multiply Efficiently", problem:"Solve 8 × 25 mentally. What strategy did you use?", hint:"25 is one quarter of 100.", answer:"200. One strategy: 4 × 25 = 100, so 8 × 25 = 200.", teacherNote:"Invite multiple strategies: doubling, grouping, or using 100." },
    { title:"Remainder Reasoning", problem:"23 students form groups of 4. How many full groups can they make, and how many students are left?", hint:"Think 4 × 5 and 4 × 6.", answer:"5 full groups with 3 students left.", teacherNote:"Connect the result to division with remainders." }
  ],
  "6–8": [
    { title:"Ratio Table", problem:"A recipe uses 3 cups of flour for every 2 cups of sugar. How much sugar is needed for 12 cups of flour?", hint:"3 cups of flour becomes 12 cups by multiplying by 4.", answer:"8 cups of sugar.", teacherNote:"Emphasize scaling both parts of the ratio by the same factor." },
    { title:"Integer Change", problem:"The temperature was -3°F and rose 11 degrees. What is the new temperature?", hint:"Move 11 spaces to the right from -3 on a number line.", answer:"8°F.", teacherNote:"Ask students to model the change with a number line." },
    { title:"Solve the Equation", problem:"Solve: 3x + 5 = 23.", hint:"Undo +5 first, then divide by 3.", answer:"x = 6.", teacherNote:"Look for inverse-operation reasoning." },
    { title:"Percent Quick Check", problem:"What is 15% of 80?", hint:"10% of 80 is 8, and 5% is half of that.", answer:"12.", teacherNote:"Encourage benchmark percent strategies." }
  ],
  "9–12": [
    { title:"Linear Function", problem:"A line has slope 3 and passes through (0, -2). Write its equation.", hint:"Use y = mx + b.", answer:"y = 3x - 2.", teacherNote:"Confirm students understand the y-intercept from (0, -2)." },
    { title:"Quadratic Roots", problem:"Solve x² - 9 = 0.", hint:"This is a difference of squares.", answer:"x = -3 or x = 3.", teacherNote:"Ask why both positive and negative values work." },
    { title:"Function Evaluation", problem:"If f(x) = 2x² - 1, what is f(3)?", hint:"Substitute 3 for x before simplifying.", answer:"17, because 2(3²) - 1 = 18 - 1.", teacherNote:"Watch order of operations." },
    { title:"Data Reasoning", problem:"A data set has mean 72. One low score of 40 is removed. Will the mean increase, decrease, or stay the same?", hint:"Think about whether 40 is below or above the mean.", answer:"The mean will increase because a below-average value was removed.", teacherNote:"Prioritize conceptual reasoning over calculation." }
  ]
};

export const DO_NOW_WRITING = {
  "K–2": [
    { title:"Favorite Place", problem:"Write one sentence about a place you like to visit. Add one detail that helps us picture it.", hint:"Start with: I like to visit...", answer:"Student responses will vary.", teacherNote:"Inspired by early-grade place and personal-experience topics. Look for one clear idea and one concrete detail." },
    { title:"Animal Expert", problem:"Write two things you know about an animal.", hint:"Choose one animal. Tell what it looks like, eats, or does.", answer:"Student responses will vary.", teacherNote:"Builds explanatory writing from high-interest topics like animals and nature." },
    { title:"How To Help", problem:"Write one way people can help keep a classroom, playground, or neighborhood clean.", hint:"Use should or can.", answer:"Student responses will vary.", teacherNote:"A quick persuasive prompt with a real classroom/community connection." },
    { title:"Tiny Story", problem:"Write two sentences about a lost mitten.", hint:"Sentence 1: Who found it? Sentence 2: What happened next?", answer:"Student responses will vary.", teacherNote:"Encourage a clear beginning and ending." },
    { title:"What If Toys Talked?", problem:"Pick a toy. Write what it might say if it could talk.", hint:"Use quotation marks if students are ready.", answer:"Student responses will vary.", teacherNote:"Creative prompt adapted from imaginative early-grade topic patterns." },
    { title:"Book Friend", problem:"Name a character from a book. Write why you would or would not want to meet them.", hint:"Use because.", answer:"Student responses will vary.", teacherNote:"Short response-to-reading practice with opinion support." },
    { title:"Funny Words", problem:"Write a word that sounds funny to you. Tell why it makes you smile.", hint:"Try saying the word quietly first.", answer:"Student responses will vary.", teacherNote:"Good for phonological play and low-pressure writing fluency." },
    { title:"I Wonder", problem:"Write one question you wonder about animals, space, weather, or the ocean.", hint:"Start with: I wonder why... or I wonder how...", answer:"Student responses will vary.", teacherNote:"Seed research curiosity without requiring research time." }
  ],
  "3–5": [
    { title:"Best Recess Game", problem:"Explain how to play a recess or playground game so a new student could join.", hint:"Use steps like first, next, then.", answer:"Student responses will vary.", teacherNote:"Procedural/explanatory writing based on familiar school topics." },
    { title:"School Needs This", problem:"What is one thing our school really needs? Write your opinion and one strong reason.", hint:"Claim + because + example.", answer:"Student responses will vary.", teacherNote:"Persuasive writing with a concrete audience and purpose." },
    { title:"Special Photograph", problem:"Describe a photo you remember. What is happening, and why does it matter?", hint:"Include who, where, and one feeling.", answer:"Student responses will vary.", teacherNote:"Narrative-memory prompt inspired by personal photograph topics." },
    { title:"Invention Idea", problem:"Invent a machine that would solve a small everyday problem. What does it do?", hint:"Name the problem before describing the machine.", answer:"Student responses will vary.", teacherNote:"Creative/explanatory blend; useful before science or design thinking." },
    { title:"Ocean Question", problem:"Write one thing you know about the ocean and one question you could research.", hint:"Separate facts from questions.", answer:"Student responses will vary.", teacherNote:"Research readiness: fact/question distinction." },
    { title:"Author Move", problem:"Think about a book you like. What is one thing the author does well?", hint:"They might use funny dialogue, suspense, description, or strong characters.", answer:"Student responses will vary.", teacherNote:"Response-to-literature prompt that names craft." },
    { title:"Storm Moment", problem:"Write the first five sentences of a story that begins during a big storm.", hint:"Use sound, movement, and one character reaction.", answer:"Student responses will vary.", teacherNote:"Creative narrative with sensory detail." },
    { title:"Team Sports", problem:"Are team sports good for students? Give one reason for your answer.", hint:"You may agree, disagree, or partly agree.", answer:"Student responses will vary.", teacherNote:"Supports nuanced opinion writing." }
  ],
  "6–8": [
    { title:"New Student Guide", problem:"Write advice for a new student who wants to have a good first week here.", hint:"Give two specific tips and explain why they help.", answer:"Student responses will vary.", teacherNote:"Explanatory writing grounded in authentic audience." },
    { title:"Change School Life", problem:"What change would improve school life? Write a claim and two reasons.", hint:"Make the change realistic enough to discuss.", answer:"Student responses will vary.", teacherNote:"Argument writing inspired by school-improvement topic patterns." },
    { title:"Memorable Ride", problem:"Write about a bus, car, train, bike, or walking trip that you remember.", hint:"Focus on one moment instead of the whole trip.", answer:"Student responses will vary.", teacherNote:"Narrative practice with narrowing focus." },
    { title:"Future Self", problem:"Imagine meeting yourself five years from now. What question would you ask, and what answer might you hope to hear?", hint:"Make the answer reveal a goal or value.", answer:"Student responses will vary.", teacherNote:"Reflective/creative prompt adapted from future-self topics." },
    { title:"Book to Screen", problem:"Should a favorite book be made into a movie or show? Explain one opportunity and one risk.", hint:"Think about characters, setting, and what might change.", answer:"Student responses will vary.", teacherNote:"Response-to-literature plus argument." },
    { title:"Job Worth Trying", problem:"Choose a job you might like to try. What would you need to learn first?", hint:"Name a skill, habit, or responsibility.", answer:"Student responses will vary.", teacherNote:"Research/career writing in short form." },
    { title:"Rule Check", problem:"Is a rule always right just because it is a rule? Write a careful answer.", hint:"Use an example, but keep it respectful.", answer:"Student responses will vary.", teacherNote:"Good for civic reasoning and classroom norms." },
    { title:"Cloud People", problem:"Write a scene set in a community that lives above the clouds.", hint:"Include one ordinary detail and one impossible detail.", answer:"Student responses will vary.", teacherNote:"Creative prompt that invites world-building without a long setup." }
  ],
  "9–12": [
    { title:"Necessary Change", problem:"What is one change that would make school more meaningful for students? Write a claim, reason, and possible objection.", hint:"Acknowledge why someone might disagree.", answer:"Student responses will vary.", teacherNote:"Argument practice with counterargument." },
    { title:"Routine Breaker", problem:"What do you do, or wish you could do, to break routine? Explain what that reveals about you.", hint:"Move from action to reflection.", answer:"Student responses will vary.", teacherNote:"Personal essay seed drawn from self-reflection topic patterns." },
    { title:"Invention We Need", problem:"What invention would you like to see in your lifetime? Explain the problem it would solve.", hint:"Be specific about who benefits.", answer:"Student responses will vary.", teacherNote:"Explanatory/argument hybrid that can lead into research." },
    { title:"Meaningful Gift", problem:"Write about a meaningful gift you gave, received, or wish you could give.", hint:"The gift can be an object, time, advice, or help.", answer:"Student responses will vary.", teacherNote:"Narrative reflection with emotional specificity." },
    { title:"Color Meaning", problem:"Choose a color and explain what it means to you. Use one memory or image.", hint:"Avoid listing; build around one example.", answer:"Student responses will vary.", teacherNote:"Good mini-practice for symbolism and concrete detail." },
    { title:"Crime Stories", problem:"Why are people drawn to mystery or crime stories? Offer one explanation.", hint:"Consider suspense, justice, fear, puzzles, or character.", answer:"Student responses will vary.", teacherNote:"Analytical writing connected to popular media." },
    { title:"Alternate Energy", problem:"Should communities push harder for alternate forms of energy? Write a claim and one evidence need.", hint:"If you need a fact, say what fact would help prove your point.", answer:"Student responses will vary.", teacherNote:"Argument plus research planning." },
    { title:"Author's Style", problem:"Think of a writer, songwriter, filmmaker, or speaker with a distinct style. What makes their style recognizable?", hint:"Point to word choice, structure, tone, image, rhythm, or theme.", answer:"Student responses will vary.", teacherNote:"Response-to-text/craft analysis, broadened beyond books." }
  ]
};
