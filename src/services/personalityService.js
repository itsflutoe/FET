import { PERSONALITY_DATA } from '../data/companionData';
const reactions={
 friendly:['Ready when you are! 💙','We can work through this together.','Nice, let’s keep going!'],
 funny:['Okay, brain cells, report for duty. 🧠','That question really woke up and chose violence.','We survived that one.'],
 calm:['No rush. Let’s take it one step at a time.','You’re doing fine. Let’s look at it carefully.','We can work through this calmly.'],
 energetic:['LET’S GO! ⚡','Okay! Time to get this one!','You’ve got this!'],
 playful:['Hehe, let’s see what this topic is hiding. 👀','Tiny study adventure?','Let’s make this one behave.'],
 shy:['I-I think we can figure this out together...','Let’s take a careful look.','You’re doing okay.'],
 encouraging:['Every question is another step forward.','You’re improving, and that matters.','Let’s keep building on that progress.'],
 sarcastic:['Apparently this topic has returned for another round.','Because apparently we needed another question.','Let’s defeat this one before it gets ideas.']
};
export function reaction(personality='friendly',index=0){const list=reactions[personality]||reactions.friendly;return list[index%list.length]}
export function personalityPrompt(personality){return PERSONALITY_DATA[personality]?.prompt||PERSONALITY_DATA.friendly.prompt}
