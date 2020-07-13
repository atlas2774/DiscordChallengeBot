const Discord = require("discord.js");
const client = new Discord.Client();

const strings = require("./strings.json");
const config = require("./config.json");
const ranks = require("./ranks.json");
const secret = require("./secret.json");
const sql = require("sqlite");
sql.open("./score.sqlite");

var role1;
var role2;
var role3;

// TODO Leaderboard


// This function is run once whenever the bot is started, use it to set the playing game on the bots profile
client.on("ready", () => {

    client.user.setActivity(config.playingGame, { type: "WATCHING" });

    console.log(`Bot Activated! Logged in as: ${client.user.tag}`);
    console.log("You are running version: " + config.botVersion + " of the ExplorationBot");
    console.log("");
});


// This function adds the UnknownZone role whenever a new user joins
client.on("guildMemberAdd", member => {
    
    var roleNew = member.guild.roles.find("name", "UnknownZone");
    member.addRole(roleNew)
});


// Ping, Help and Challenge Info function
client.on("message", (message) => {

    if (message.author.bot) return;
    if (message.content.startsWith(config.prefix + "ping")) {

        message.channel.send("pong!");

    }

    if (message.content.startsWith(config.prefix + "help")) {
        if (message.member.roles.some(r => ["Admin", "Bot"].includes(r.name))) {

            message.author.send({
                embed: {
                    title: "Debug Commands (Admin only)",
                    color: 16711680,
                    description: "addpoint <@user> <amount> - Adds a specified amount of points to a person's point total\n\nremove point <@user> <amount> - Removes a specified amount of points from a user\n\nverify advanced/beginner - Overrides a current challenge\n\nchallenge info - Debug information about the challenges"
                }

            });

        }
        message.author.send({
            embed: {
                title: "Bot commands",
                color: 3447003,
                description: "ping - Pings the bot to see if it's alive\n\nchallenge beginner - Starts a beginner challenge if there is not already one taking place\n\nchallenge advanced - Starts an advanced challenge if there is not already one taking place\n\nchallenge extreme - Starts an extreme challenge if there is not already one taking place\n\npoints - Shows your current amount of points and your current rank\n\nsolve advanced - Ask the challenge poster to confirm your challenge\n\nsolve beginner - Ask the challenge poster to confirm your challenge\n\nsolve extreme - Ask the challenge poster to confirm your challenge\n\naccept/decline, advanced/beginner/extreme - Either accepts or declines the user's challenge\n\ncancel advance/beginner/extreme - Cancel's the current challenge (only usable by the challenge author or an admin)"
            }

        });

    }
    if (message.content.startsWith(config.prefix + "challenge info")) {

        sql.get(`SELECT * FROM scores`).then(row => {

            message.channel.send({

                embed: {
                    title: "Challenge Information",
                    color: 16711680,
                    description: `Beginner challenge holder = ${row.setBeginner}\n
                        BeginnerLock = ${row.beginnerLock}\n
                        Advanced challenge holder = ${row.setAdvance}\n
                        AdvancedLock = ${row.advanceLock}\n
                        Extreme challenge holder = ${row.setExtreme}\n
                        ExtremeLock = ${row.extremeLock}\n
                        Classic challenge holder = ${row.setClassic}\n
                        ClassicLock = ${row.ClassicLock}\n
                        ClassicBasic challenge holder = ${row.setClassicBasic}\n
                        ClassicBasicLock = ${row.ClassicBasicLock}
                        `
                }

            })

        })

    }



});


// Point command
client.on("message", (message) => {
    if (message.channel.type === "dm") return;
    if (message.author.bot) return;

    if (message.content.startsWith(config.prefix + "point")) {

        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("Your current points are: 0, and your rank is : Unranked");
            message.reply(`Your current points are: ${row.points} and your rank is: ${row.name}`);            
        })

    };    

});


// Addpoint command
client.on("message", (message) => {
    
    if (message.content.startsWith(config.prefix + "addpoint")) {
        
        if (message.member.roles.some(r => ["Admin", "Bot", "Community Mod"].includes(r.name))) {
            try {

                let member2 = message.mentions.members.first();
                const args = message.content.slice(config.prefix).trim().split(/ +/g);
                const command = args.shift().toLowerCase();
                var argtoint = parseInt(args[1], 10)
                

                if (isNaN(argtoint)) {
                    message.channel.send("Syntax error: !addpoint <@User> <Number of points to add>")
                }
                else {
                    sql.get(`SELECT * FROM scores WHERE userId = ${member2.id}`).then(row => {
                        
                          message.channel.send("Added " + (argtoint) + " point(s) to " + (member2) + " sucessfully!");
                          sql.run(`UPDATE scores SET points = ${row.points + argtoint} WHERE userid = ${member2.id}`);
                        
                    }).catch(() => {

                        sql.run(strings.defaultSQLCreate).then(() => {
                            sql.run(`INSERT INTO scores (userId, points, rank, name) VALUES (?, ?, ?, ?)`, [member2.id, argtoint, 0, ranks.rank0]);
                        });
                    });
                }
                
            } catch (e) {
                message.channel.send("Syntax error: !addpoint <@User> <Number of points to add>")
            }
            

        }
    }
});


// Remove point command
client.on("message", (message) => {

    if (message.content.startsWith(config.prefix + "remove point")) {

        if (message.member.roles.some(r => ["Admin", "Bot", "Community Mod"].includes(r.name))) {
            try {

                let member2 = message.mentions.members.first();
                const args = message.content.slice(config.prefix).trim().split(/ +/g);
                const command = args.shift().toLowerCase();
                var argtoint2 = parseInt(args[2], 10);

                if (isNaN(argtoint2)) {
                    message.channel.send("Syntax error: !remove point <@User> <Number of points to remove>")
                }
                else {
                    sql.get(`SELECT * FROM scores WHERE userId = ${member2.id}`).then(row => {

                        message.channel.send("Removed " + (argtoint2) + " point(s) from " + (member2) + " sucessfully!");
                        sql.run(`UPDATE scores SET points = ${row.points - argtoint2} WHERE userid = ${member2.id}`)

                    }).catch(() => {


                        sql.run(strings.defaultSQLCreate).then(() => {
                            sql.run("INSERT INTO scores (userId, points, rank, name) VALUES (?, ?, ?, ?)", [member2.id, 1, 0, ranks.rank0]);
                        });
                    });
                }

            } catch (e) {
                message.channel.send("Syntax Error: !remove point <@User> <Amount of points to remove>");
            }


        }
    }
});


// Create Beginner challenge
client.on("message", (message) => {
    if (message.author.bot) return;
    if (message.channel.type === "dm") return;
    if (message.channel.id !== '421094563436822529') return; // comment this line for command to work in dev server
    if (message.content.startsWith(config.prefix + "challenge basic")) {
        sql.get(`SELECT * FROM scores`).then(row => {
            if (!row) {
                

            } else {
                sql.run(`UPDATE scores SET beginnerLock = ${row.beginnerLock + 1}`);

            }
            if (row.beginnerChallengerId === null) {
                if (row.beginnerLock < 1) {

                    message.reply("Has set a basic challenge! Solve this challenge by posting a picture of your character in the same place, and earn 3 points!")

                    sql.run(`UPDATE scores SET setBeginner = "${message.author}"`);
                    sql.run(`UPDATE scores SET setBeginnerId = ${message.author.id}`);
                    sql.run(`UPDATE scores SET beginnerLock = ${row.beginnerLock + 1}`);
                }
                else {
                    message.reply("You cannot post another challenge at this time.");
                }
            }
            if (row.beginnerChallengerId !== null) {
                if (row.beginnerLock < 1 && message.author.id === row.beginnerChallengerId) {

                    message.reply("Has set a basic challenge! Solve this challenge by posting a picture of your character in the same place, and earn 3 points!")

                    sql.run(`UPDATE scores SET setBeginner = "${message.author}"`);
                    sql.run(`UPDATE scores SET setBeginnerId = ${message.author.id}`);
                    sql.run(`UPDATE scores SET beginnerLock = ${row.beginnerLock + 1}`);
                }
                else {
                    message.reply("You cannot post another challenge at this time.");
                }
            }


        })
    };

});


// Create Advanced challenge
client.on("message", (message) => {
    if (message.author.bot) return;
    if (message.channel.type === "dm") return;
    if (message.channel.id !== '421094764809814016') return; // comment this line for command to work in dev server
    if (message.content.startsWith(config.prefix + "challenge advanced")) {
        sql.get(`SELECT * FROM scores`).then(row => {
            if (!row) {
                

            } else {


            }
            if (row.advancedChallengerId === null) {
                if (row.advanceLock < 1) {
                    message.reply("Has set an advanced challenge! Solve this challenge by posting a picture of your character in the same place, and earn 5 points!")

                    sql.run(`UPDATE scores SET setAdvance = "${message.author}"`);
                    sql.run(`UPDATE scores SET setAdvanceId = ${message.author.id}`);
                    sql.run(`UPDATE scores SET advanceLock = ${row.advanceLock + 1}`);
                } else {
                    message.reply("You cannot post another challenge at this time.");
                }
            }
            if (row.advancedChallengerId !== null) {
                if (row.advanceLock < 1 && message.author.id === row.advancedChallengerId) {
                    message.reply("Has set an advanced challenge! Solve this challenge by posting a picture of your character in the same place, and earn 5 points!")

                    sql.run(`UPDATE scores SET setAdvance = "${message.author}"`);
                    sql.run(`UPDATE scores SET setAdvanceId = ${message.author.id}`);
                    sql.run(`UPDATE scores SET advanceLock = ${row.advanceLock + 1}`);
                } else {
                    message.reply("You cannot post another challenge at this time.");
                }
            }



        })
    };
});

// Create Extreme Challenge
client.on("message", (message) => {
    if (message.author.bot) return;
    if (message.channel.type === "dm") return;
    if (message.channel.id !== '498890419048939530') return; // comment this line for command to work in dev server
    if (message.content.startsWith(config.prefix + "challenge extreme")) {
        sql.get(`SELECT * FROM scores`).then(row => {
            if (!row) {
                

            } else {


            }
            if (row.extremeChallengerId === null) {
                if (row.extremeLock < 1) {
                    message.reply("Has set an extreme challenge! Solve this challenge by posting a picture of your character in the same place, and earn 5 points + 5 more for every week the challenge stays up! (Max 20 points) ")

                    sql.run(`UPDATE scores SET setExtreme = "${message.author}"`);
                    sql.run(`UPDATE scores SET setExtremeId = ${message.author.id}`);
                    sql.run(`UPDATE scores SET extremeLock = ${row.extremeLock + 1}`);
                } else {
                    message.reply("You cannot post another challenge at this time.");
                }
            }
            if (row.extremeChallengerId !== null) {
                if (row.extremeLock < 1 && message.author.id === row.extremeChallengerId) {
                    message.reply("Has set an extreme challenge! Solve this challenge by posting a picture of your character in the same place, and earn 5 points + 5 more for every week the challenge stays up! (Max 20 points) ")

                    sql.run(`UPDATE scores SET setExtreme = "${message.author}"`);
                    sql.run(`UPDATE scores SET setExtremeId = ${message.author.id}`);
                    sql.run(`UPDATE scores SET extremeLock = ${row.extremeLock + 1}`);
                } else {
                    message.reply("You cannot post another challenge at this time.");
                }
            }


        })
    };
});

// Create Classic Challenge
client.on("message", (message) => {
    if (message.author.bot) return;
    if (message.channel.type === "dm") return;
    if (message.channel.id !== '608051152269082636') return; // comment this line for command to work in dev server
    if (message.content.startsWith(config.prefix + "challenge classic advanced")) {
        sql.get(`SELECT * FROM scores`).then(row => {
            if (!row) {
                

            } else {


            }
            if (row.classicChallengerId === null) {
                if (row.ClassicLock < 1) {
                    message.reply("Has set a Classic WoW advanced challenge! Solve this challenge by posting a picture of your character in the same place, and earn 5 points!")

                    sql.run(`UPDATE scores SET setClassic = "${message.author}"`);
                    sql.run(`UPDATE scores SET setClassicId = ${message.author.id}`);
                    sql.run(`UPDATE scores SET ClassicLock = ${row.ClassicLock + 1}`);
                } else {
                    message.reply("You cannot post another challenge at this time.");
                }
            }
            if (row.classicChallengerId !== null) {
                if (row.ClassicLock < 1 && message.author.id === row.classicChallengerId) {
                    message.reply("Has set a Classic WoW advanced challenge! Solve this challenge by posting a picture of your character in the same place, and earn 5 points!")

                    sql.run(`UPDATE scores SET setClassic = "${message.author}"`);
                    sql.run(`UPDATE scores SET setClassicId = ${message.author.id}`);
                    sql.run(`UPDATE scores SET ClassicLock = ${row.ClassicLock + 1}`);
                } else {
                    message.reply("You cannot post another challenge at this time.");
                }
            }


        })
    };
});

// Create Classic basic Challenge
client.on("message", (message) => {
    if (message.author.bot) return;
    if (message.channel.type === "dm") return;
    if (message.channel.id !== '718459742275764242') return; // comment this line for command to work in dev server
    if (message.content.startsWith(config.prefix + "challenge classic basic")) {
        sql.get(`SELECT * FROM scores`).then(row => {
            if (!row) {


            } else {


            }
            if (row.classicBasicChallengerId === null) {
                if (row.ClassicBasicLock < 1) {
                    message.reply("Has set a Classic WoW basic challenge! Solve this challenge by posting a picture of your character in the same place, and earn 3 points!")

                    sql.run(`UPDATE scores SET setClassicBasic = "${message.author}"`);
                    sql.run(`UPDATE scores SET setClassicBasicId = ${message.author.id}`);
                    sql.run(`UPDATE scores SET ClassicBasicLock = ${row.ClassicBasicLock + 1}`);
                } else {
                    message.reply("You cannot post another challenge at this time.");
                }
            }
            if (row.classicBasicChallengerId !== null) {
                if (row.ClassicBasicLock < 1 && message.author.id === row.classicBasicChallengerId) {
                    message.reply("Has set a Classic WoW basic challenge! Solve this challenge by posting a picture of your character in the same place, and earn 3 points!")

                    sql.run(`UPDATE scores SET setClassicBasic = "${message.author}"`);
                    sql.run(`UPDATE scores SET setClassicBasicId = ${message.author.id}`);
                    sql.run(`UPDATE scores SET ClassicBasicLock = ${row.ClassicBasicLock + 1}`);
                } else {
                    message.reply("You cannot post another challenge at this time.");
                }
            }


        })
    };
});


// Solve Beginner challenge
client.on("message", (message) => {
    if (message.author.bot) return;
    if (message.channel.id !== '421094563436822529') return; // comment this line for command to work in dev server
    if (message.channel.type === "dm") return;
    if (message.content.startsWith(config.prefix + "solve basic")) {
        sql.get(`SELECT * FROM scores`).then(row => {
            //if user already holds 1 challenge, block him from solving this.

            if (message.author.id === row.setExtremeId || message.author.id === row.setAdvanceId || message.author.id === row.setBeginnerId || message.author.id === row.setClassicId || message.author.id === row.setClassicBasicId) {

                message.channel.send(`You can only be Master of one Exploration Challenge at a time.`);
                return;
            }


            else {
                if (row.beginnerLock > 0 && row.isVerifyBeginner < 1 && message.author.id !== row.setBeginnerId) {
                    message.channel.send(`A challenger has solved this challenge ${row.setBeginner} or an Admin will need to verify it is correct by typing !accept basic or !decline basic if it's not correct`)

                    sql.run(`UPDATE scores SET isVerifyBeginner = ${row.isVerifyBeginner + 1}`);
                    sql.run(`UPDATE scores SET beginnerChallenger = "${message.author}"`);
                    sql.run(`UPDATE scores SET beginnerChallengerId = ${message.author.id}`);


                } else {
                    message.channel.send(`You must wait until ${row.setBeginner} has verified the current query`);
                }
            }

        });



    }
});
// Solve advanced challenge
client.on("message", (message) => {
    if (message.author.bot) return;
    if (message.channel.id !== '421094764809814016') return; // comment this line for command to work in dev server
    if (message.channel.type === "dm") return;
    if (message.content.startsWith(config.prefix + "solve advanced")) {
        sql.get(`SELECT * FROM scores`).then(row => {
            //if user already holds 1 challenge, block him from solving this.

            if (message.author.id === row.setExtremeId || message.author.id === row.setAdvanceId || message.author.id === row.setBeginnerId || message.author.id === row.setClassicId || message.author.id === row.setClassicBasicId) {

                message.channel.send(`You can only be Master of one Exploration Challenge at a time.`);
                return;
            }


            else {
                if (row.advanceLock > 0 && row.isVerifyAdvance < 1 && message.author.id !== row.setAdvanceId) {
                    message.channel.send(`A challenger has solved this challenge ${row.setAdvance} or an Admin will need to verify it is correct by typing !accept advanced or !decline advanced if it's not correct`)

                    sql.run(`UPDATE scores SET isVerifyAdvance = ${row.isVerifyAdvance + 1}`);
                    sql.run(`UPDATE scores SET advancedChallenger = "${message.author}"`);
                    sql.run(`UPDATE scores SET advancedChallengerId = ${message.author.id}`);


                } else {
                    message.channel.send(`You must wait until ${row.setAdvance} has verified the current query`);
                }
            }

        });



    }
});

// Solve Extreme
client.on("message", (message) => {
    if (message.author.bot) return;
    if (message.channel.id !== '498890419048939530') return; // comment this line for command to work in dev server
    if (message.channel.type === "dm") return;
    if (message.content.startsWith(config.prefix + "solve extreme")) {
        sql.get(`SELECT * FROM scores`).then(row => {
            //if user already holds 1 challenge, block him from solving this.

            if (message.author.id === row.setExtremeId || message.author.id === row.setAdvanceId || message.author.id === row.setBeginnerId || message.author.id === row.setClassicId || message.author.id === row.setClassicBasicId) {

                message.channel.send(`You can only be Master of one Exploration Challenge at a time.`);
                return;
            }


            else {
                if (row.extremeLock > 0 && row.isVerifyExtreme < 1 && message.author.id !== row.setExtremeId) {
                    message.channel.send(`A challenger has solved this challenge ${row.setExtreme} or an Admin will need to verify it is correct by typing !accept extreme or !decline extreme if it's not correct`)

                    sql.run(`UPDATE scores SET isVerifyExtreme = ${row.isVerifyExtreme + 1}`);
                    sql.run(`UPDATE scores SET extremeChallenger = "${message.author}"`);
                    sql.run(`UPDATE scores SET extremeChallengerId = ${message.author.id}`);


                } else {
                    message.channel.send(`You must wait until ${row.setExtreme} has verified the current query`);
                }
            }

        });



    }
});


// Solve Classic challenge
client.on("message", (message) => {


    if (message.author.bot) return;
    if (message.channel.id !== '608051152269082636') return; // comment this line for command to work in dev server
    if (message.channel.type === "dm") return;
    if (message.content.startsWith(config.prefix + "solve classic advanced")) {
        sql.get(`SELECT * FROM scores`).then(row => {
            //if user already holds 1 challenge, block him from solving this.

            if (message.author.id === row.setExtremeId || message.author.id === row.setAdvanceId || message.author.id === row.setBeginnerId || message.author.id === row.setClassicId || message.author.id === row.setClassicBasicId) {

                message.channel.send(`You can only be Master of one Exploration Challenge at a time.`);
                return;
            }


            else {
                if (row.ClassicLock > 0 && row.isVerifyClassic < 1 && message.author.id !== row.setClassicId) {
                    message.channel.send(`A challenger has solved this challenge ${row.setClassic} or an Admin will need to verify it is correct by typing !accept classic advanced or !decline classic advanced if it's not correct`)

                    sql.run(`UPDATE scores SET isVerifyClassic = ${row.isVerifyClassic + 1}`);
                    sql.run(`UPDATE scores SET classicChallenger = "${message.author}"`);
                    sql.run(`UPDATE scores SET classicChallengerId = ${message.author.id}`);


                } else {
                    message.channel.send(`You must wait until ${row.setClassic} has verified the current query`);
                }
            }

        });



    }
});

// Solve Classic Basic Challenge
client.on("message", (message) => {


    if (message.author.bot) return;
    if (message.channel.id !== '718459742275764242') return; // comment this line for command to work in dev server
    if (message.channel.type === "dm") return;
    if (message.content.startsWith(config.prefix + "solve classic basic")) {
        sql.get(`SELECT * FROM scores`).then(row => {
            //if user already holds 1 challenge, block him from solving this.

            if (message.author.id === row.setExtremeId || message.author.id === row.setAdvanceId || message.author.id === row.setBeginnerId || message.author.id === row.setClassicId || message.author.id === row.setClassicBasicId) {

                message.channel.send(`You can only be Master of one Exploration Challenge at a time.`);
                return;
            }


            else {
                if (row.ClassicBasicLock > 0 && row.isVerifyClassicBasic < 1 && message.author.id !== row.setClassicBasicId) {
                    message.channel.send(`A challenger has solved this challenge ${row.setClassicBasic} or an Admin will need to verify it is correct by typing !accept classic basic or !decline classic basic if it's not correct`)

                    sql.run(`UPDATE scores SET isVerifyClassicBasic = ${row.isVerifyClassicBasic + 1}`);
                    sql.run(`UPDATE scores SET classicBasicChallenger = "${message.author}"`);
                    sql.run(`UPDATE scores SET classicBasicChallengerId = ${message.author.id}`);


                } else {
                    message.channel.send(`You must wait until ${row.setClassicBasic} has verified the current query`);
                }
            }

        });



    }
});

// Cancel Advanced challenge
client.on("message", (message) => {
    if (message.author.bot) return;
    if (message.channel.type === "dm") return;
    if (message.content.startsWith(config.prefix + "cancel advanced")) {
        sql.get(`SELECT * FROM scores`).then(row => {
            if (row.isVerifyAdvance > 0 && row.setAdvanceId === message.author.id || message.member.roles.some(r => ["Admin", "Bot", "Community Mod"].includes(r.name))) {
                message.channel.send(`The advanced challenge has been canceled.`);

                sql.run(`UPDATE scores SET advanceLock = ${row.advanceLock} - ${row.advanceLock}`);
                sql.run(`UPDATE scores SET isVerifyAdvance = ${row.isVerifyAdvance} - ${row.isVerifyAdvance}`);
                sql.run(`UPDATE scores SET advancedChallengerId = ${row.advancedChallengerId = null}`);
                sql.run(`UPDATE scores SET advancedChallenger = ${row.advancedChallenger = null}`);
            }
            else {
                
            }
        })
    };
});
// Cancel Classic challenge
client.on("message", (message) => {
    if (message.author.bot) return;
    if (message.channel.type === "dm") return;
    if (message.channel.id !== '608051152269082636') return;
    if (message.content.startsWith(config.prefix + "cancel classic advanced")) {
        sql.get(`SELECT * FROM scores`).then(row => {
            if (row.isVerifyClassic > 0 && row.setClassicId === message.author.id || message.member.roles.some(r => ["Admin", "Bot", "Community Mod"].includes(r.name))) {
                message.channel.send(`The classic advanced challenge has been canceled.`);

                sql.run(`UPDATE scores SET ClassicLock = ${row.ClassicLock} - ${row.ClassicLock}`);
                sql.run(`UPDATE scores SET isVerifyClassic = ${row.isVerifyClassic} - ${row.isVerifyClassic}`);
                sql.run(`UPDATE scores SET classicChallengerId = ${row.classicChallengerId = null}`);
                sql.run(`UPDATE scores SET classicChallenger = ${row.classicChallenger = null}`);
            }
            else {
                
            }
        })
    };
});

// cancel extreme
client.on("message", (message) => {
    if (message.author.bot) return;
    if (message.channel.type === "dm") return;
    if (message.content.startsWith(config.prefix + "cancel extreme")) {
        sql.get(`SELECT * FROM scores`).then(row => {
            if (row.isVerifyExtreme > 0 && row.setExtremeId === message.author.id || message.member.roles.some(r => ["Admin", "Bot", "Community Mod"].includes(r.name))) {
                message.channel.send(`The extreme challenge has been canceled.`);

                sql.run(`UPDATE scores SET extremeLock = ${row.extremeLock} - ${row.extremeLock}`);
                sql.run(`UPDATE scores SET isVerifyExtreme = ${row.isVerifyExtreme} - ${row.isVerifyExtreme}`);
                sql.run(`UPDATE scores SET extremeChallengerId = ${row.extremeChallengerId = null}`);
                sql.run(`UPDATE scores SET extremeChallenger = ${row.extremeChallenger = null}`);
            } else {

            }
        })
    };

});


// Accept advanced
client.on("message", (message) => {
    if (message.author.bot) return;
    if (message.channel.type === "dm") return;
    if (message.content.startsWith(config.prefix + "accept advanced")) {
        sql.get(`SELECT * FROM scores`).then(row => {
            if (row.isVerifyAdvance > 0 && row.setAdvanceId === message.author.id || message.member.roles.some(r => ["Admin", "Bot", "Community Mod"].includes(r.name))) {
                sql.get(`SELECT * FROM scores WHERE userId = ${row.advancedChallengerId}`).then(row => {
                    if (!row) {
                        sql.get(`SELECT * FROM scores`).then(row => {
                            message.channel.send(`Congratulations ${row.advancedChallenger} your challenge solve has been accepted and you have earned 5 points! Your current point total is: 5`);
                        })

                    } else {
                        message.channel.send(`Congratulations ${row.advancedChallenger} your challenge solve has been accepted and you have earned 5 points! Your current point total is: ${row.points + 5}`);
                    }

                })

  
                sql.run(`UPDATE scores SET advanceLock = ${row.advanceLock} - ${row.advanceLock}`);
                sql.run(`UPDATE scores SET isVerifyAdvance = ${row.isVerifyAdvance} - ${row.isVerifyAdvance}`);


                // TODO FIX THIS 
                // Make this a function or SOMETHING. blegh
                sql.get(`SELECT * FROM scores WHERE userId = ${row.advancedChallengerId}`).then(row => {
                    if (!row) {
                        sql.run("INSERT INTO scores (userId, points, rank, name) VALUES (?, ?, ?, ?)", [row.advancedChallengerId, 1, 0, ranks.rank0]);
                        curLevel = row.points + 5;
                    } else {
                        sql.run(`UPDATE scores SET points = ${row.points + 5} WHERE userId = ${row.advancedChallengerId}`);
                        curLevel = row.points + 5;
                        
                    }


                    if (row.points >= 49 && row.points < 98 && row.rank === 0) {
                        sql.run(`UPDATE scores SET rank = ${row.rank + 1} WHERE userId = ${row.advancedChallengerId}`);
                        sql.run(`UPDATE scores SET name = "${ranks.rank1}" WHERE userId = ${row.advancedChallengerId}`);
                        message.channel.send(row.advancedChallenger + "You've ranked up to rank: " + ranks.rank1);
                        rankInNum = row.rank + 1;


                    } else {

                    }


                    if (row.points >= 99 && row.points < 198 && row.rank === 1) {
                        sql.run(`UPDATE scores SET rank = ${row.rank + 1} WHERE userId = ${row.advancedChallengerId}`);
                        sql.run(`UPDATE scores SET name = "${ranks.rank2}" WHERE userId = ${row.advancedChallengerId}`);
                        message.channel.send(row.advancedChallenger + "You've ranked up to rank: " + ranks.rank2);
                        rankInNum = row.rank + 1;

                    } else {

                    }

                    if (row.points >= 199 && row.points < 298 && row.rank === 2) {
                        sql.run(`UPDATE scores SET rank = ${row.rank + 1} WHERE userId = ${row.advancedChallengerId}`);
                        sql.run(`UPDATE scores SET name = "${ranks.rank3}" WHERE userId = ${row.advancedChallengerId}`);
                        message.channel.send(row.advancedChallenger + "You've ranked up to rank: " + ranks.rank3);
                        rankInNum = row.rank + 1;


                    } else {

                    }
                }).catch(() => {
                    console.error;
                    sql.run("CREATE TABLE IF NOT EXISTS scores (userId TEXT, points INTEGER, rank INTEGER, name TEXT, advanceLock INTEGER, setAdvance TEXT, setAdvanceId TEXT, isVerifyAdvance INTEGER, advancedChallenger TEXT, advancedChallengerId TEXT, beginnerLock INTEGER, setBeginner TEXT, setBeginnerId TEXT, isVerifyBeginner INTEGER, beginnerChallenger TEXT, beginnerChallengerId TEXT)").then(() => {
                        sql.run("INSERT INTO scores (userId, points, rank, name, advanceLock, setAdvance, setAdvanceId, isVerifyAdvance, advancedChallenger, advancedChallengerId, beginnerLock, setBeginner, setBeginnerId, isVerifyBeginner, beginnerChallenger, beginnerChallengerId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [row.advancedChallengerId, 5, 0, ranks.rank0, 0, "nobody", "nobodytwo", 0, "nobodythree", "nobodyfour", 0, "nobodyfive", "nobodysix", 0, "nobodyseven", "nobodyeight"]);
                    });
                });



            } else {

            }

        })
    };
    if (message.content.startsWith(config.prefix + "decline advanced")) {
        sql.get(`SELECT * FROM scores`).then(row => {
            if (row.isVerifyAdvance > 0 && row.setAdvanceId === message.author.id || message.member.roles.some(r => ["Admin", "Bot", "Community Mod"].includes(r.name))) {
                message.channel.send(`Bad news ${row.advancedChallenger} your challenge solve has been declined. Please try again.`);

                sql.run(`UPDATE scores SET isVerifyAdvance = ${row.isVerifyAdvance} - ${row.isVerifyAdvance}`)

            }

        });


    }

});
// Accept Classic
client.on("message", (message) => {
    if (message.author.bot) return;
    if (message.channel.type === "dm") return;
    if (message.channel.id !== '608051152269082636') return;
    if (message.content.startsWith(config.prefix + "accept classic advanced")) {
        sql.get(`SELECT * FROM scores`).then(row => {
            if (row.isVerifyClassic > 0 && row.setClassicId === message.author.id || message.member.roles.some(r => ["Admin", "Bot", "Community Mod"].includes(r.name))) {
                sql.get(`SELECT * FROM scores WHERE userId = ${row.classicChallengerId}`).then(row => {
                    if (!row) {
                        sql.get(`SELECT * FROM scores`).then(row => {
                            message.channel.send(`Congratulations ${row.classicChallenger} your challenge solve has been accepted and you have earned 5 points! Your current point total is: 5`);
                        })

                    } else {
                        message.channel.send(`Congratulations ${row.classicChallenger} your challenge solve has been accepted and you have earned 5 points! Your current point total is: ${row.points + 5}`);
                    }

                })

                
                sql.run(`UPDATE scores SET ClassicLock = ${row.ClassicLock} - ${row.ClassicLock}`);
                sql.run(`UPDATE scores SET isVerifyClassic = ${row.isVerifyClassic} - ${row.isVerifyClassic}`);
                

                // TODO FIX THIS ABSOLUTE SHITE
                // Make this a funciton or SOMETHING. blegh
                sql.get(`SELECT * FROM scores WHERE userId = ${row.classicChallengerId}`).then(row => {
                    if (!row) {
                        sql.run("INSERT INTO scores (userId, points, rank, name) VALUES (?, ?, ?, ?)", [row.classicChallengerId, 1, 0, ranks.rank0]);
                        curLevel = row.points + 5;
                    } else {
                        sql.run(`UPDATE scores SET points = ${row.points + 5} WHERE userId = ${row.classicChallengerId}`);
                        curLevel = row.points + 5;
                        
                    }

                    
                    if (row.points >= 49 && row.points < 98 && row.rank === 0) {
                        sql.run(`UPDATE scores SET rank = ${row.rank + 1} WHERE userId = ${row.classicChallengerId}`);
                        sql.run(`UPDATE scores SET name = "${ranks.rank1}" WHERE userId = ${row.classicChallengerId}`);
                        message.channel.send(row.classicChallenger + "You've ranked up to rank: " + ranks.rank1);
                        rankInNum = row.rank + 1;


                    } else {

                    }


                    if (row.points >= 99 && row.points < 198 && row.rank === 1) {
                        sql.run(`UPDATE scores SET rank = ${row.rank + 1} WHERE userId = ${row.classicChallengerId}`);
                        sql.run(`UPDATE scores SET name = "${ranks.rank2}" WHERE userId = ${row.classicChallengerId}`);
                        message.channel.send(row.classicChallenger + "You've ranked up to rank: " + ranks.rank2);
                        rankInNum = row.rank + 1;

                    } else {

                    }

                    if (row.points >= 199 && row.points < 298 && row.rank === 2) {
                        sql.run(`UPDATE scores SET rank = ${row.rank + 1} WHERE userId = ${row.classicChallengerId}`);
                        sql.run(`UPDATE scores SET name = "${ranks.rank3}" WHERE userId = ${row.classicChallengerId}`);
                        message.channel.send(row.classicChallenger + "You've ranked up to rank: " + ranks.rank3);
                        rankInNum = row.rank + 1;


                    } else {

                    }
                    //do I need to add classic tables below? -Dovah
                }).catch(() => {
                    console.error;
                    sql.run("CREATE TABLE IF NOT EXISTS scores (userId TEXT, points INTEGER, rank INTEGER, name TEXT, advanceLock INTEGER, setAdvance TEXT, setAdvanceId TEXT, isVerifyAdvance INTEGER, advancedChallenger TEXT, advancedChallengerId TEXT, beginnerLock INTEGER, setBeginner TEXT, setBeginnerId TEXT, isVerifyBeginner INTEGER, beginnerChallenger TEXT, beginnerChallengerId TEXT)").then(() => {
                        sql.run("INSERT INTO scores (userId, points, rank, name, advanceLock, setAdvance, setAdvanceId, isVerifyAdvance, advancedChallenger, advancedChallengerId, beginnerLock, setBeginner, setBeginnerId, isVerifyBeginner, beginnerChallenger, beginnerChallengerId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [row.classicChallengerId, 5, 0, ranks.rank0, 0, "nobody", "nobodytwo", 0, "nobodythree", "nobodyfour", 0, "nobodyfive", "nobodysix", 0, "nobodyseven", "nobodyeight"]);
                    });
                });



            } else {

            }

        })
    };
    //Decline Classic
    if (message.content.startsWith(config.prefix + "decline classic advanced")) {
        sql.get(`SELECT * FROM scores`).then(row => {
            if (row.isVerifyClassic > 0 && row.setClassicId === message.author.id || message.member.roles.some(r => ["Admin", "Bot", "Community Mod"].includes(r.name))) {
                message.channel.send(`Bad news ${row.classicChallenger} your challenge solve has been declined. Please try again.`);
 
                sql.run(`UPDATE scores SET isVerifyClassic = ${row.isVerifyClassic} - ${row.isVerifyClassic}`)

            }

        });


    }

});

// Accept Classic Basic
client.on("message", (message) => {
    if (message.author.bot) return;
    if (message.channel.type === "dm") return;
    if (message.channel.id !== '718459742275764242') return;
    if (message.content.startsWith(config.prefix + "accept classic basic")) {
        sql.get(`SELECT * FROM scores`).then(row => {
            if (row.isVerifyClassicBasic > 0 && row.setClassicBasicId === message.author.id || message.member.roles.some(r => ["Admin", "Bot", "Community Mod"].includes(r.name))) {
                sql.get(`SELECT * FROM scores WHERE userId = ${row.classicBasicChallengerId}`).then(row => {
                    if (!row) {
                        sql.get(`SELECT * FROM scores`).then(row => {
                            message.channel.send(`Congratulations ${row.classicBasicChallenger} your challenge solve has been accepted and you have earned 3 points! Your current point total is: 3`);
                        })

                    } else {
                        message.channel.send(`Congratulations ${row.classicBasicChallenger} your challenge solve has been accepted and you have earned 3 points! Your current point total is: ${row.points + 3}`);
                    }

                })


                sql.run(`UPDATE scores SET ClassicBasicLock = ${row.ClassicBasicLock} - ${row.ClassicBasicLock}`);
                sql.run(`UPDATE scores SET isVerifyClassicBasic = ${row.isVerifyClassicBasic} - ${row.isVerifyClassicBasic}`);


                // TODO FIX THIS ABSOLUTE SHITE
                // Make this a funciton or SOMETHING. blegh
                sql.get(`SELECT * FROM scores WHERE userId = ${row.classicBasicChallengerId}`).then(row => {
                    if (!row) {
                        sql.run("INSERT INTO scores (userId, points, rank, name) VALUES (?, ?, ?, ?)", [row.classicBasicChallengerId, 1, 0, ranks.rank0]);
                        curLevel = row.points + 3;
                    } else {
                        sql.run(`UPDATE scores SET points = ${row.points + 3} WHERE userId = ${row.classicBasicChallengerId}`);
                        curLevel = row.points + 3;

                    }


                    if (row.points >= 49 && row.points < 98 && row.rank === 0) {
                        sql.run(`UPDATE scores SET rank = ${row.rank + 1} WHERE userId = ${row.classicBasicChallengerId}`);
                        sql.run(`UPDATE scores SET name = "${ranks.rank1}" WHERE userId = ${row.classicBasicChallengerId}`);
                        message.channel.send(row.classicBasicChallenger + "You've ranked up to rank: " + ranks.rank1);
                        rankInNum = row.rank + 1;


                    } else {

                    }


                    if (row.points >= 99 && row.points < 198 && row.rank === 1) {
                        sql.run(`UPDATE scores SET rank = ${row.rank + 1} WHERE userId = ${row.classicBasicChallengerId}`);
                        sql.run(`UPDATE scores SET name = "${ranks.rank2}" WHERE userId = ${row.classicBasicChallengerId}`);
                        message.channel.send(row.classicBasicChallenger + "You've ranked up to rank: " + ranks.rank2);
                        rankInNum = row.rank + 1;

                    } else {

                    }

                    if (row.points >= 199 && row.points < 298 && row.rank === 2) {
                        sql.run(`UPDATE scores SET rank = ${row.rank + 1} WHERE userId = ${row.classicBasicChallengerId}`);
                        sql.run(`UPDATE scores SET name = "${ranks.rank3}" WHERE userId = ${row.classicBasicChallengerId}`);
                        message.channel.send(row.classicBasicChallenger + "You've ranked up to rank: " + ranks.rank3);
                        rankInNum = row.rank + 1;


                    } else {

                    }
                    //do I need to add classic tables below? -Dovah
                }).catch(() => {
                    console.error;
                    sql.run("CREATE TABLE IF NOT EXISTS scores (userId TEXT, points INTEGER, rank INTEGER, name TEXT, advanceLock INTEGER, setAdvance TEXT, setAdvanceId TEXT, isVerifyAdvance INTEGER, advancedChallenger TEXT, advancedChallengerId TEXT, beginnerLock INTEGER, setBeginner TEXT, setBeginnerId TEXT, isVerifyBeginner INTEGER, beginnerChallenger TEXT, beginnerChallengerId TEXT)").then(() => {
                        sql.run("INSERT INTO scores (userId, points, rank, name, advanceLock, setAdvance, setAdvanceId, isVerifyAdvance, advancedChallenger, advancedChallengerId, beginnerLock, setBeginner, setBeginnerId, isVerifyBeginner, beginnerChallenger, beginnerChallengerId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [row.classicBasicChallengerId, 3, 0, ranks.rank0, 0, "nobody", "nobodytwo", 0, "nobodythree", "nobodyfour", 0, "nobodyfive", "nobodysix", 0, "nobodyseven", "nobodyeight"]);
                    });
                });



            } else {

            }

        })
    };
    //Decline Classic basic
    if (message.content.startsWith(config.prefix + "decline classic basic")) {
        sql.get(`SELECT * FROM scores`).then(row => {
            if (row.isVerifyClassicBasic > 0 && row.setClassicBasicId === message.author.id || message.member.roles.some(r => ["Admin", "Bot", "Community Mod"].includes(r.name))) {
                message.channel.send(`Bad news ${row.classicBasicChallenger} your challenge solve has been declined. Please try again.`);

                sql.run(`UPDATE scores SET isVerifyClassicBasic = ${row.isVerifyClassicBasic} - ${row.isVerifyClassicBasic}`)

            }

        });


    }

});


// Verify extreme challenge
client.on("message", (message) => {
    if (message.author.bot) return;
    if (message.channel.type === "dm") return;
    if (message.content.startsWith(config.prefix + "accept extreme")) {
        sql.get(`SELECT * FROM scores`).then(row => {
            if (row.isVerifyExtreme > 0 && row.setExtremeId === message.author.id || message.member.roles.some(r => ["Admin", "Bot", "Community Mod"].includes(r.name))) {
                sql.get(`SELECT * FROM scores WHERE userId = ${row.extremeChallengerId}`).then(row => {
                    if (!row) {
                        sql.get(`SELECT * FROM scores`).then(row => {
                            message.channel.send(`Congratulations ${row.extremeChallenger} your challenge solve has been accepted and you have earned 5 points! Your current point total is: 5`);
                        })

                    } else {
                        message.channel.send(`Congratulations ${row.extremeChallenger} your challenge solve has been accepted and you have earned 5 points! Your current point total is: ${row.points + 5}`);
                    }

                })
                
                sql.run(`UPDATE scores SET extremeLock = ${row.extremeLock} - ${row.extremeLock}`);
                sql.run(`UPDATE scores SET isVerifyExtreme = ${row.isVerifyExtreme} - ${row.isVerifyExtreme}`);
                

                
                sql.get(`SELECT * FROM scores WHERE userId = ${row.extremeChallengerId}`).then(row => {
                    if (!row) {
                        sql.run("INSERT INTO scores (userId, points, rank, name) VALUES (?, ?, ?, ?)", [row.extremeChallengerId, 1, 0, ranks.rank0]);
                        curLevel = row.points + 5;
                    } else {
                        sql.run(`UPDATE scores SET points = ${row.points + 5} WHERE userId = ${row.extremeChallengerId}`);
                        curLevel = row.points + 5;
                        
                    }

                    
                    if (row.points >= 49 && row.points < 98 && row.rank === 0) {
                        sql.run(`UPDATE scores SET rank = ${row.rank + 1} WHERE userId = ${row.extremeChallengerId}`);
                        sql.run(`UPDATE scores SET name = "${ranks.rank1}" WHERE userId = ${row.extremeChallengerId}`);
                        message.channel.send(row.extremeChallenger + "You've ranked up to rank: " + ranks.rank1);
                        rankInNum = row.rank + 1;


                    } else {

                    }


                    if (row.points >= 99 && row.points < 198 && row.rank === 1) {
                        sql.run(`UPDATE scores SET rank = ${row.rank + 1} WHERE userId = ${row.extremeChallengerId}`);
                        sql.run(`UPDATE scores SET name = "${ranks.rank2}" WHERE userId = ${row.extremeChallengerId}`);
                        message.channel.send(row.extremeChallenger + "You've ranked up to rank: " + ranks.rank2);
                        rankInNum = row.rank + 1;

                    } else {

                    }

                    if (row.points >= 199 && row.points < 298 && row.rank === 2) {
                        sql.run(`UPDATE scores SET rank = ${row.rank + 1} WHERE userId = ${row.extremeChallengerId}`);
                        sql.run(`UPDATE scores SET name = "${ranks.rank3}" WHERE userId = ${row.extremeChallengerId}`);
                        message.channel.send(row.extremeChallenger + "You've ranked up to rank: " + ranks.rank3);
                        rankInNum = row.rank + 1;


                    } else {

                    }
                }).catch(() => {
                    console.error;
                    sql.run("CREATE TABLE IF NOT EXISTS scores (userId TEXT, points INTEGER, rank INTEGER, name TEXT, advanceLock INTEGER, setAdvance TEXT, setAdvanceId TEXT, isVerifyAdvance INTEGER, advancedChallenger TEXT, advancedChallengerId TEXT, beginnerLock INTEGER, setBeginner TEXT, setBeginnerId TEXT, isVerifyBeginner INTEGER, beginnerChallenger TEXT, beginnerChallengerId TEXT, extremeLock INTEGER, setExtreme TEXT, setExtremeId TEXT, isVerifyExtreme INTEGER, extremeChallenger TEXT, extremeChallengerId TEXT)").then(() => {
                        sql.run("INSERT INTO scores (userId, points, rank, name, advanceLock, setAdvance, setAdvanceId, isVerifyAdvance, advancedChallenger, advancedChallengerId, beginnerLock, setBeginner, setBeginnerId, isVerifyBeginner, beginnerChallenger, beginnerChallengerId, extremeLock, setExtreme, setExtremeId, isVerifyExtreme, extremeChallenger, extremeChallengerId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [row.extremeChallengerId, 10, 0, ranks.rank0, 0, "nobody", "nobodytwo", 0, "nobodythree", "nobodyfour", 0, "nobodyfive", "nobodysix", 0, "nobodyseven", "nobodyeight", 0, "nobodynine", "nobodyten", 0, "nobodyeleven", "nobodytwelve"]);
                    });
                });



            } else {

            }
        })
    };
    if (message.content.startsWith(config.prefix + "decline extreme")) {
        sql.get(`SELECT * FROM scores`).then(row => {
            if (row.isVerifyExtreme > 0 && row.setExtremeId === message.author.id || message.member.roles.some(r => ["Admin", "Bot", "Community Mod"].includes(r.name))) {
                message.channel.send(`Bad news ${row.extremeChallenger} your challenge solve has been declined. Please try again.`);
                
                sql.run(`UPDATE scores SET isVerifyExtreme = ${row.isVerifyExtreme} - ${row.isVerifyExtreme}`)

            }

        });


    }

});

// Verify Beginner challenge
client.on("message", (message) => {
    if (message.author.bot) return;
    if (message.channel.type === "dm") return;
    if (message.content.startsWith(config.prefix + "accept basic")) {
        sql.get(`SELECT * FROM scores`).then(row => {
            if (row.isVerifyBeginner > 0 && row.setBeginnerId === message.author.id || message.member.roles.some(r => ["Admin", "Bot", "Community Mod"].includes(r.name))) {
                sql.get(`SELECT * FROM scores WHERE userId = ${row.beginnerChallengerId}`).then(row => {
                    if (!row) {
                        sql.get(`SELECT * FROM scores`).then(row => {
                            message.channel.send(`Congratulations ${row.beginnerChallenger} your challenge solve has been accepted and you have earned 3 points! Your current point total is: 3`);
                        })

                    } else {
                        message.channel.send(`Congratulations ${row.beginnerChallenger} your challenge solve has been accepted and you have earned 3 points! Your current point total is: ${row.points + 3}`);
                    }


                })
                
                sql.run(`UPDATE scores SET beginnerLock = ${row.beginnerLock} - ${row.beginnerLock}`);
                sql.run(`UPDATE scores SET isVerifyBeginner = ${row.isVerifyBeginner} - ${row.isVerifyBeginner}`);
                

                
                sql.get(`SELECT * FROM scores WHERE userId = ${row.beginnerChallengerId}`).then(row => {
                    if (!row) {
                        sql.run("INSERT INTO scores (userId, points, rank, name) VALUES (?, ?, ?, ?)", [row.beginnerChallengerId, 1, 0, ranks.rank0]);
                        curLevel = row.points + 3;
                    } else {
                        sql.run(`UPDATE scores SET points = ${row.points + 3} WHERE userId = ${row.beginnerChallengerId}`);
                        curLevel = row.points + 3;
                        


                    }
                    
                    if (row.points >= 49 && row.points < 98 && row.rank === 0) {
                        sql.run(`UPDATE scores SET rank = ${row.rank + 1} WHERE userId = ${row.beginnerChallengerId}`);
                        sql.run(`UPDATE scores SET name = "${ranks.rank1}" WHERE userId = ${row.beginnerChallengerId}`);
                        message.channel.send(row.beginnerChallenger + "You've ranked up to rank: " + ranks.rank1);
                        rankInNum = row.rank + 1;


                    } else {

                    }


                    if (row.points >= 99 && row.points < 198 && row.rank === 1) {
                        sql.run(`UPDATE scores SET rank = ${row.rank + 1} WHERE userId = ${row.beginnerChallengerId}`);
                        sql.run(`UPDATE scores SET name = "${ranks.rank2}" WHERE userId = ${row.beginnerChallengerId}`);
                        message.channel.send(row.beginnerChallenger + "You've ranked up to rank: " + ranks.rank2);
                        rankInNum = row.rank + 1;

                    } else {

                    }

                    if (row.points >= 199 && row.points < 298 && row.rank === 2) {
                        sql.run(`UPDATE scores SET rank = ${row.rank + 1} WHERE userId = ${row.beginnerChallengerId}`);
                        sql.run(`UPDATE scores SET name = "${ranks.rank3}" WHERE userId = ${row.beginnerChallengerId}`);
                        message.channel.send(row.beginnerChallenger + "You've ranked up to rank: " + ranks.rank3);
                        rankInNum = row.rank + 1;


                    } else {

                    }
                }).catch(() => {
                    console.error;
                    sql.run("CREATE TABLE IF NOT EXISTS scores (userId TEXT, points INTEGER, rank INTEGER, name TEXT, advanceLock INTEGER, setAdvance TEXT, setAdvanceId TEXT, isVerifyAdvance INTEGER, advancedChallenger TEXT, advancedChallengerId TEXT, beginnerLock INTEGER, setBeginner TEXT, setBeginnerId TEXT, isVerifyBeginner INTEGER, beginnerChallenger TEXT, beginnerChallengerId TEXT)").then(() => {
                        sql.run("INSERT INTO scores (userId, points, rank, name, advanceLock, setAdvance, setAdvanceId, isVerifyAdvance, advancedChallenger, advancedChallengerId, beginnerLock, setBeginner, setBeginnerId, isVerifyBeginner, beginnerChallenger, beginnerChallengerId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [row.beginnerChallengerId, 3, 0, ranks.rank0, 0, "nobody", "nobodytwo", 0, "nobodythree", "nobodyfour", 0, "nobodyfive", "nobodysix", 0, "nobodyseven", "nobodyeight"]);
                    });
                });



            } else {

            }
        })
    };
    if (message.content.startsWith(config.prefix + "decline basic")) {
        sql.get(`SELECT * FROM scores`).then(row => {
            if (row.isVerifyBeginner > 0 && row.setBeginnerId === message.author.id || message.member.roles.some(r => ["Admin", "Bot", "Community Mod"].includes(r.name))) {
                message.channel.send(`Bad news ${row.beginnerChallenger} your challenge solve has been declined. Please try again.`);
                
                sql.run(`UPDATE scores SET isVerifyBeginner = ${row.isVerifyBeginner} - ${row.isVerifyBeginner}`)

            }

        });


    }
});

// Cancel Beginner
client.on("message", (message) => {
    if (message.author.bot) return;
    if (message.channel.type === "dm") return;
    if (message.content.startsWith(config.prefix + "cancel basic")) {
        sql.get(`SELECT * FROM scores`).then(row => {
            if (row.isVerifyBeginner > 0 && row.setBeginnerId === message.author.id || message.member.roles.some(r => ["Admin", "Bot", "Community Mod"].includes(r.name))) {
                message.channel.send(`The basic challenge has been canceled.`);
                
                sql.run(`UPDATE scores SET beginnerLock = ${row.beginnerLock} - ${row.beginnerLock}`);
                sql.run(`UPDATE scores SET isVerifyBeginner = ${row.isVerifyBeginner} - ${row.isVerifyBeginner}`);
                sql.run(`UPDATE scores SET beginnerChallengerId = ${row.beginnerChallengerId = null}`);
                sql.run(`UPDATE scores SET beginnerChallenger = ${row.beginnerChallenger = null}`);
                
            } else {

            }
        })
    };

});

// Cancel Classic Basic
client.on("message", (message) => {
    if (message.author.bot) return;
    if (message.channel.type === "dm") return;
    if (message.channel.id !== '718459742275764242') return;
    if (message.content.startsWith(config.prefix + "cancel classic basic")) {
        sql.get(`SELECT * FROM scores`).then(row => {
            if (row.isVerifyClassicBasic > 0 && row.setClassicBasicId === message.author.id || message.member.roles.some(r => ["Admin", "Bot", "Community Mod"].includes(r.name))) {
                message.channel.send(`The classic basic challenge has been canceled.`);

                sql.run(`UPDATE scores SET ClassicBasicLock = ${row.ClassicBasicLock} - ${row.ClassicBasicLock}`);
                sql.run(`UPDATE scores SET isVerifyClassicBasic = ${row.isVerifyClassicBasic} - ${row.isVerifyClassicBasic}`);
                sql.run(`UPDATE scores SET classicBasicChallengerId = ${row.classicBasicChallengerId = null}`);
                sql.run(`UPDATE scores SET classicBasicChallenger = ${row.classicBasicChallenger = null}`);
            }
            else {

            }
        })
    };
});



// TODO remake this awful system
// Add rank for advanced
client.on("message", (message) => {
    sql.get(`SELECT * FROM scores`).then(row => {
        if (message.content.startsWith(row.advancedChallenger + "You've ranked up to rank: Challenger")) {
            
            role1 = message.guild.roles.find("name", "Challenger");
            let member = message.mentions.members.first();
            member.addRole(role1);
            
        } else {

        }

        if (message.content.startsWith(row.advancedChallenger + "You've ranked up to rank: Elite Challenger")) {
           
            role2 = message.guild.roles.find("name", "Elite Challenger");
            let member2 = message.mentions.members.first();
            member2.addRole(role2);
            
        } else {

        }

        if (message.content.startsWith(row.advancedChallenger + "You've ranked up to rank: Legendary Challenger")) {
            
            role3 = message.guild.roles.find("name", "Legendary Challenger");
            let member = message.mentions.members.first();
            member.addRole(role3);
            
        } else {

        }

        if (message.content.startsWith(row.beginnerChallenger + "You've ranked up to rank: Challenger")) {
            
            role1 = message.guild.roles.find("name", "Challenger");
            let member = message.mentions.members.first();
            member.addRole(role1);
            
        } else {

        }

        if (message.content.startsWith(row.beginnerChallenger + "You've ranked up to rank: Elite Challenger")) {
            
            role2 = message.guild.roles.find("name", "Elite Challenger");
            let member2 = message.mentions.members.first();
            member2.addRole(role2);
            
        } else {

        }

        if (message.content.startsWith(row.beginnerChallenger + "You've ranked up to rank: Legendary Challenger")) {
            
            role3 = message.guild.roles.find("name", "Legendary Challenger");
            let member = message.mentions.members.first();
            member.addRole(role3);
            
        } else {

        }
    });


});
























//Client login token
client.login(secret.token);
