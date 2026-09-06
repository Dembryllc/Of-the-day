/*
 * On This Day content banks
 * Extracted from src/App.jsx so the content banks can grow without
 * bloating the app shell. Shapes are unchanged.
 */

export const ON_THIS_DAY_FALLBACK = {
  "01-01": [
    { year: "1892", title: "Ellis Island opened in New York Harbor. Millions of people later came through this station when moving to the United States.", category: "History" },
    { year: "1801", title: "Giuseppe Piazzi discovered Ceres, the largest object in the asteroid belt between Mars and Jupiter.", category: "Space" },
    { year: "1863", title: "The Emancipation Proclamation took effect. It became an important step toward freedom in the United States.", category: "Civics" }
  ],
  "02-01": [
    { year: "1960", title: "Four college students began a peaceful sit-in in Greensboro, North Carolina. Their courage helped more people work for fair treatment.", category: "Civics" },
    { year: "1884", title: "The first part of the Oxford English Dictionary was published, helping people learn about words and their histories.", category: "Language" },
    { year: "2003", title: "NASA learned important safety lessons from the Space Shuttle Columbia mission.", category: "Space" }
  ],
  "03-14": [
    { year: "1879", title: "Albert Einstein was born. He became famous for asking big questions about light, energy, space, and time.", category: "Science" },
    { year: "1988", title: "Pi Day was first celebrated at the Exploratorium in San Francisco. Pi helps people measure circles.", category: "Math" },
    { year: "1995", title: "Astronaut Norman Thagard became the first American to ride to space on a Russian spacecraft.", category: "Space" }
  ],
  "04-22": [
    { year: "1970", title: "The first Earth Day was celebrated. People used the day to learn how to protect air, water, animals, and land.", category: "Nature" },
    { year: "1838", title: "The steamship Sirius completed an early trip across the Atlantic Ocean using steam power.", category: "Transportation" },
    { year: "1993", title: "The first web browser for many home computers helped more people explore the World Wide Web.", category: "Technology" }
  ],
  "04-30": [
    { year: "1789", title: "George Washington became the first president of the United States. Students can ask what makes a good leader.", category: "Civics" },
    { year: "1993", title: "CERN shared World Wide Web technology for anyone to use freely, helping the internet grow.", category: "Technology" },
    { year: "1803", title: "The Louisiana Purchase doubled the size of the United States and changed maps of North America.", category: "Geography" }
  ],
  "05-05": [
    { year: "1961", title: "Alan Shepard became the first American to travel into space. His short flight helped NASA learn more about human space travel.", category: "Space" },
    { year: "1862", title: "The Battle of Puebla later became connected to Cinco de Mayo, a celebration of Mexican history and culture.", category: "Culture" },
    { year: "1904", title: "Cy Young pitched baseball's first perfect game in the modern era.", category: "Sports" }
  ],
  "06-19": [
    { year: "1865", title: "Juneteenth marks the day many enslaved people in Texas learned they were free.", category: "Civics" },
    { year: "2021", title: "Juneteenth became a federal holiday in the United States.", category: "Civics" },
    { year: "1978", title: "The comic strip Garfield first appeared in newspapers.", category: "Arts & Culture" }
  ],
  "07-20": [
    { year: "1969", title: "Apollo 11 astronauts Neil Armstrong and Buzz Aldrin walked on the Moon.", category: "Space" },
    { year: "1976", title: "NASA's Viking 1 lander reached Mars and sent pictures back to Earth.", category: "Space" },
    { year: "1940", title: "The first Billboard music popularity chart was published.", category: "Arts & Culture" }
  ],
  "08-28": [
    { year: "1963", title: "Martin Luther King Jr. shared his famous dream for fairness during the March on Washington.", category: "Civics" },
    { year: "1993", title: "The Galileo spacecraft flew by an asteroid named Ida and discovered it had a tiny moon.", category: "Space" },
    { year: "1907", title: "UPS began as a small messenger company in Seattle before growing into a worldwide delivery service.", category: "Inventions" }
  ],
  "09-17": [
    { year: "1787", title: "Delegates signed the United States Constitution in Philadelphia.", category: "Civics" },
    { year: "1976", title: "NASA publicly introduced the first space shuttle, Enterprise.", category: "Space" },
    { year: "1920", title: "The National Football League began as a small group of teams.", category: "Sports" }
  ],
  "10-04": [
    { year: "1957", title: "Sputnik 1 became the first artificial satellite to orbit Earth.", category: "Space" },
    { year: "1822", title: "Rutherford B. Hayes was born. He later became the 19th U.S. president.", category: "Famous People" },
    { year: "1535", title: "The first complete English Bible was printed, helping more people read it in English.", category: "Language" }
  ],
  "11-09": [
    { year: "1989", title: "The Berlin Wall opened. Families and friends who had been separated could visit each other again.", category: "History" },
    { year: "1967", title: "The first issue of Rolling Stone magazine was published, sharing stories about music and culture.", category: "Arts & Culture" },
    { year: "1934", title: "Astronomer Carl Sagan was born. He helped many people get excited about space.", category: "Space" }
  ],
  "12-10": [
    { year: "1901", title: "The first Nobel Prizes were awarded to people who made important contributions to the world.", category: "Science" },
    { year: "1948", title: "The United Nations adopted the Universal Declaration of Human Rights.", category: "Civics" },
    { year: "1815", title: "Ada Lovelace was born. She is remembered for early ideas about computer programming.", category: "Technology" }
  ],
  default: [
    { year: "1969", title: "Apollo 11 astronauts walked on the Moon. What do you think teamwork sounded like during the mission?", category: "Space" },
    { year: "1970", title: "Earth Day began as a way for people to learn how to protect nature and the planet.", category: "Nature" },
    { year: "1903", title: "The Wright brothers made one of the first powered airplane flights. It lasted less than a minute.", category: "Inventions" },
    { year: "1934", title: "Jane Goodall was born. She later studied chimpanzees and taught people to care about animals.", category: "Animals" },
    { year: "1955", title: "Marian Anderson became the first Black singer to perform with the Metropolitan Opera.", category: "Arts & Culture" },
    { year: "1947", title: "Jackie Robinson joined Major League Baseball and helped professional sports become more fair.", category: "Sports" },
    { year: "1990", title: "The Hubble Space Telescope launched and began helping people see deep into space.", category: "Space" },
    { year: "1958", title: "LEGO bricks began using their modern interlocking design, making creative building easier.", category: "Inventions" }
  ]
};

export const ELEMENTARY_ON_THIS_DAY = {
  "K–2": [
    { year: "1934", title: "Jane Goodall was born. She grew up loving animals and later studied chimpanzees.", category: "Animals", prompt: "What animal would you like to learn more about?" },
    { year: "1958", title: "LEGO bricks began using their modern snap-together design.", category: "Inventions", prompt: "What would you build if you had unlimited bricks?" },
    { year: "1969", title: "Astronauts walked on the Moon for the first time.", category: "Space", prompt: "What would you want to see on the Moon?" },
    { year: "1970", title: "Earth Day began so people could learn how to take care of our planet.", category: "Nature", prompt: "What is one way our class can help the Earth?" },
    { year: "1903", title: "The Wright brothers flew an early airplane for less than one minute.", category: "Inventions", prompt: "Why do you think trying again matters?" },
    { year: "1990", title: "The Hubble Space Telescope went to space and began taking pictures of stars and galaxies.", category: "Space", prompt: "What do you wonder about space?" },
    { year: "1947", title: "Jackie Robinson helped make baseball more fair for everyone.", category: "Sports", prompt: "What does fairness look like in a game?" },
    { year: "1983", title: "Sally Ride became the first American woman to travel into space.", category: "Space", prompt: "What brave thing might an astronaut need to do?" }
  ],
  "3–5": [
    { year: "1888", title: "The National Geographic Society was founded to help people learn about maps, animals, cultures, and Earth.", category: "Geography", prompt: "What place, animal, or culture would you like to investigate?" },
    { year: "1876", title: "Alexander Graham Bell received a patent for the telephone, helping people talk across long distances.", category: "Inventions", prompt: "How did phones change the way people communicate?" },
    { year: "1962", title: "Mae Jemison was born. She later became the first Black woman to travel into space.", category: "Famous People", prompt: "What character trait helps someone do something new?" },
    { year: "1928", title: "Alexander Fleming noticed something that helped lead to penicillin, an important medicine.", category: "Science", prompt: "Why is careful observation important in science?" },
    { year: "1914", title: "Garrett Morgan patented safety equipment that helped protect rescue workers.", category: "Inventions", prompt: "What problem would you invent something to solve?" },
    { year: "1869", title: "The first U.S. transcontinental railroad helped people and goods travel across the country faster.", category: "Transportation", prompt: "How does transportation change communities?" },
    { year: "1706", title: "Benjamin Franklin was born. He became a writer, inventor, scientist, and leader.", category: "Famous People", prompt: "Why might curiosity help someone learn many things?" },
    { year: "1901", title: "The first Nobel Prizes honored people whose work helped the world.", category: "Science", prompt: "What kind of helpful work should be celebrated?" }
  ]
};
