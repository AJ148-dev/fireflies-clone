from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import ActionItem, Meeting, Summary, Topic, TranscriptSegment, User
from app.services.meetings import add_children, replace_participants

AUDIO = "/sample.wav"


def _dt(value: str) -> datetime:
    return datetime.fromisoformat(value).replace(tzinfo=timezone.utc)


def seed_if_empty(db: Session) -> None:
    if db.query(Meeting).first() is not None:
        return
    user = db.query(User).first()
    if user is None:
        user = User(name="Maya Chen", email="maya@example.com")
        db.add(user)
        db.flush()
    now = datetime.now(timezone.utc)
    for spec in MEETINGS:
        meeting = Meeting(
            user_id=user.id,
            title=spec["title"],
            started_at=_dt(spec["started_at"]),
            duration_seconds=spec["duration_seconds"],
            audio_path=AUDIO,
            created_at=now,
            updated_at=now,
        )
        db.add(meeting)
        db.flush()
        replace_participants(db, meeting, spec["participants"])
        add_children(
            meeting,
            [
                {
                    "speaker_name": speaker,
                    "start_seconds": float(start),
                    "end_seconds": float(end),
                    "text": text,
                    "position": index,
                }
                for index, (speaker, start, end, text) in enumerate(spec["lines"])
            ],
            spec["summary"],
            spec["topics"],
            spec["action_items"],
        )
    db.commit()


def _line(speaker: str, start: int, text: str, span: int = 6):
    return (speaker, start, start + span, text)


MEETINGS = [
    {
        "title": "Q4 roadmap review",
        "started_at": "2026-10-01T15:00:00",
        "duration_seconds": 75,
        "participants": ["Maya Chen", "Ava Shah", "Noah Kim"],
        "summary": (
            "The group walked the Q4 roadmap and agreed the billing rewrite stays in October, "
            "while the mobile offline mode moves to November. Noah will send revised dates today, "
            "and Ava will confirm the design capacity for the checkout refresh."
        ),
        "topics": [
            {"title": "October scope", "start_seconds": 4},
            {"title": "What slips", "start_seconds": 28},
            {"title": "Owners", "start_seconds": 52},
        ],
        "action_items": [
            {"text": "Send the revised Q4 dates", "is_done": False},
            {"text": "Confirm design capacity for checkout", "is_done": False},
            {"text": "Drop offline mode from the October board", "is_done": False},
        ],
        "lines": [
            _line("Maya Chen", 4, "Let's lock the roadmap before Friday's planning."),
            _line("Ava Shah", 12, "Checkout is the one flow customers still bounce on."),
            _line("Noah Kim", 20, "Billing rewrite is staffed. I would not add scope there."),
            _line("Ava Shah", 28, "Offline mode needs another design pass. It should slip."),
            _line("Maya Chen", 36, "Then October is billing plus the checkout refresh."),
            _line("Noah Kim", 44, "I can publish revised dates by the end of the day."),
            _line("Ava Shah", 52, "I'll confirm whether design can cover checkout this month."),
            _line("Maya Chen", 64, "Good. We'll review the board again on Monday."),
        ],
    },
    {
        "title": "Acme discovery call",
        "started_at": "2026-09-28T18:30:00",
        "duration_seconds": 70,
        "participants": ["Maya Chen", "Priya Nair"],
        "summary": (
            "Priya described Acme's rollout across three regions and a hard requirement for "
            "invoice export before procurement will sign. Maya will send a sample export and a "
            "security packet. Pricing stays out of this conversation until legal reviews the packet."
        ),
        "topics": [
            {"title": "Rollout", "start_seconds": 3},
            {"title": "Invoice export", "start_seconds": 24},
            {"title": "Next step", "start_seconds": 48},
        ],
        "action_items": [
            {"text": "Send Acme a sample invoice export", "is_done": False},
            {"text": "Share the security packet with Priya", "is_done": False},
            {"text": "Hold pricing until legal reviews the packet", "is_done": False},
        ],
        "lines": [
            _line("Priya Nair", 3, "We are rolling this out in three regions, starting with London."),
            _line("Maya Chen", 12, "What has to be true before procurement will sign?"),
            _line("Priya Nair", 24, "Invoice export is the blocker. Finance will not move without it."),
            _line("Maya Chen", 34, "We can generate a CSV of paid invoices. Would that unblock them?"),
            _line("Priya Nair", 42, "Yes, if it includes tax and the account owner."),
            _line("Maya Chen", 48, "I'll send a sample export and our security packet tomorrow."),
            _line("Priya Nair", 58, "Please keep pricing out of the thread until legal reads that packet."),
        ],
    },
    {
        "title": "Sprint retro",
        "started_at": "2026-09-24T10:00:00",
        "duration_seconds": 68,
        "participants": ["Maya Chen", "Noah Kim", "Leo Martins"],
        "summary": (
            "The sprint shipped the search filter, but review waited on flaky end-to-end tests. "
            "The team will quarantine the flaky suite and keep retro notes in the meeting page "
            "instead of a side doc. Noah already filed the test ticket."
        ),
        "topics": [
            {"title": "What shipped", "start_seconds": 2},
            {"title": "Flaky tests", "start_seconds": 22},
            {"title": "Working agreement", "start_seconds": 46},
        ],
        "action_items": [
            {"text": "Quarantine the flaky end-to-end suite", "is_done": True},
            {"text": "Keep retro notes on the meeting page", "is_done": False},
            {"text": "Cut the next sprint a day earlier", "is_done": False},
        ],
        "lines": [
            _line("Leo Martins", 2, "Search filter shipped. That was the sprint goal."),
            _line("Noah Kim", 14, "Review sat for two days on tests that fail only at night."),
            _line("Maya Chen", 22, "Let's quarantine that suite so it stops blocking merge."),
            _line("Noah Kim", 32, "I filed the ticket this morning. It's the done item."),
            _line("Leo Martins", 46, "Can we stop pasting retro notes into a doc nobody opens?"),
            _line("Maya Chen", 54, "Yes. Action items live here, and we cut scope a day earlier."),
        ],
    },
    {
        "title": "Design critique",
        "started_at": "2026-09-18T16:15:00",
        "duration_seconds": 60,
        "participants": ["Ava Shah", "Leo Martins"],
        "summary": (
            "Ava walked the meeting page: transcript on the left, summary on the right, player "
            "along the bottom. Leo asked for a stronger active line and initials instead of photos. "
            "The empty search state still needs a sentence, which Ava will add."
        ),
        "topics": [
            {"title": "Layout", "start_seconds": 2},
            {"title": "Active line", "start_seconds": 20},
            {"title": "Empty state", "start_seconds": 40},
        ],
        "action_items": [
            {"text": "Strengthen the active transcript line", "is_done": True},
            {"text": "Use initials for participants", "is_done": False},
            {"text": "Write the empty search sentence", "is_done": False},
        ],
        "lines": [
            _line("Ava Shah", 2, "Transcript stays in the main column. Summary sits on the right."),
            _line("Leo Martins", 12, "The player should stay pinned so scrubbing never covers a line."),
            _line("Ava Shah", 20, "The active line is too quiet. It needs the purple bar."),
            _line("Leo Martins", 30, "Use initials. We don't have photos for most guests."),
            _line("Ava Shah", 40, "Empty search currently looks blank. I'll add one sentence."),
            _line("Leo Martins", 50, "That's the pass. We can critique color after the sync works."),
        ],
    },
    {
        "title": "How the Scaler ecosystem is going global",
        "started_at": "2026-10-08T10:00:00",
        "duration_seconds": 489,
        "participants": ["Naga Chadanya", "Anuman Singh"],
        "summary": (
            "Naga Chadanya meets Anuman Singh, a Scalar co-founder, in San Francisco. "
            "Anuman says a student who wants to work there needs depth in a skill, and that a degree matters less than what they can build. "
            "Scalar AI Labs sits next to frontier companies, takes hard problems those models miss, and improves them with rubrics, environments, and reinforcement learning."
        ),
        "topics": [
            {"title": "Meeting in San Francisco", "start_seconds": 0},
            {"title": "Why the lab is here", "start_seconds": 75},
            {"title": "Advice for students", "start_seconds": 130},
            {"title": "Skills over a degree", "start_seconds": 226},
            {"title": "What Scalar AI Labs builds", "start_seconds": 365},
        ],
        "action_items": [
            {"text": "Build real depth in one skill before aiming for a role in San Francisco", "is_done": False},
            {"text": "Use college to explore problems outside the curriculum", "is_done": False},
            {"text": "Choose a college for the people, teachers, culture, and curriculum", "is_done": False},
        ],
        "lines": [
            ("Naga Chadanya", 0, 8, 'I never imagined I would meet the founder of my college in San Francisco.'),
            ("Naga Chadanya", 8, 15, "Hey, I'm Naga Chadanya, a third-year undergrad at Scala School of Technology and a year ago I joined Pocket, a YC backed startup as a founding engineer."),
            ("Naga Chadanya", 15, 23, "Honestly, the Bangalore to San Francisco thing still feels a bit unreal and today I'm catching up with Anuman Singh who is one of the co-founders of Scalar."),
            ("Naga Chadanya", 23, 28, 'So if like there is a college student right there in India, what would you suggest doing to land a job here or come here eventually?'),
            ("Anuman Singh", 28, 31, 'Have a lot of depth in your skill.'),
            ("Anuman Singh", 31, 40, "Without that you can't get to a place that is considered enviable. Yeah. I mean nobody cares about degree."),
            ("Anuman Singh", 40, 42, "I don't know like how many times I have to repeat this."),
            ("Naga Chadanya", 42, 50, "Yeah. Yeah. But he's been in SF a lot these days. So today we're going to a spot I think where you'll all will recognize. So come let's walk by me."),
            ("Naga Chadanya", 50, 58, 'So here we are at the Rincon Park which is like the one of the most iconic parks here in SF.'),
            ("Naga Chadanya", 58, 75, "Yeah, I think once Anuman comes let's go have a talk with him and see how it goes. Hey guys, we have Anuman here who is one of the founders of Scalar and they set up Scalar AI Labs here and we are here today to really understand what Scalar is doing here and why you set up Scalar AI Labs."),
            ("Anuman Singh", 75, 81, 'One problem being in India was that we were very far away from whatever is happening in AI. We need to be at the center of it.'),
            ("Anuman Singh", 81, 98, "Correct. And that's why we actually set up another commercial entity which can actually work with whoever the frontier company is and just keep sourcing a lot of frontier problems, very very hard true research problems from those companies commercially."),
            ("Naga Chadanya", 98, 106, "So it's been like 3 years you started Scala School of Technology. Right now we are here at San Francisco. I just really want to understand how your journey has been into starting Scala School of Technology till date."),
            ("Anuman Singh", 106, 124, 'Last 3, 4 years have been in optimizing how do we create the right kind of groups together, how do we find these really interesting problems to source and bring to the campus. So that is why we set up the innovation lab first so that we can get founders from outside.'),
            ("Naga Chadanya", 124, 126, 'I think you got introduced to Abilash in the same one.'),
            ("Anuman Singh", 126, 128, 'Yeah yeah yeah, same one, and I work for the Urban Company as well.'),
            ("Naga Chadanya", 128, 130, 'Ah I see. Okay.'),
            ("Naga Chadanya", 130, 145, 'So coming to the second part, a lot of people dream around coming and working in SF with companies that are around here. So if there is a college student right there in India who is in the first or second or third year, what would you suggest around doing to land a job here or come eventually?'),
            ("Anuman Singh", 145, 148, 'You should be answering that question instead of me.'),
            ("Anuman Singh", 148, 159, "The first thing that is super important is you should have a lot of depth in your skill. Without that you can't get to a place that is considered enviable. So that's part one."),
            ("Anuman Singh", 159, 172, 'And then part two is instead of sticking to what your curriculum is teaching you and this just that being your narrow focus. College is one place where you want to go and explore and solve a lot of problems.'),
            ("Naga Chadanya", 172, 188, "Okay. Coming to the third question. You're seeing a lot of people, let's say my juniors or seniors, we are currently having a placement season. How the college is going towards placing the right people at the right companies, what do you think about that?"),
            ("Anuman Singh", 188, 203, 'The program was designed right from day one to be extremely hands-on. The design has that you have to go and do an internship. The design actually encourages you to work with founders to build with them.'),
            ("Anuman Singh", 203, 206, 'I mean how many exams have you given on paper?'),
            ("Naga Chadanya", 206, 211, "I think it's zero. I think it's only the math exams that he wrote and other all were on the computer."),
            ("Anuman Singh", 211, 226, "Yeah, all of your exams are on your computer, then you have to build something. So the whole philosophy of the institute is that you have to get your hands dirty. If you get your hands dirty, you're extremely hands-on, you have this high bias for action, you'll be valuable everywhere."),
            ("Naga Chadanya", 226, 234, 'As SST we clearly focus on the skills and outcome. Why was there a deliberate change around you going towards skills and outcomes rather than having a very flashy degree?'),
            ("Anuman Singh", 234, 249, "Yeah, I mean nobody cares about degree. I don't know like how many times I have to repeat this. To be honest, let me break it down. You're here in SF, you look at anybody's degree. Even people who graduate from Stanford, they typically have a BS, bachelor of science in electrical engineering. It's not even computer science."),
            ("Anuman Singh", 249, 269, 'Today, with the capabilities of a machine, I can measure how much you know and how productive you are going to be tomorrow. Why should I index on a useless degree to hire you instead of indexing on what can you do as of today? I can make you sit in at work and get you to do three different things and that will tell me whether you are qualified to do the job or not.'),
            ("Anuman Singh", 269, 289, "If there is anybody listening to this who is looking to choose a new college, and I'm not saying this as a person from SST, I'm saying this is the same advice I would give to my brother also, which is choose an institute where you know that there are a lot of really good people. So there's a really high density intelligent community that you can learn from."),
            ("Anuman Singh", 289, 312, "And they have the right kind of teacher, they have the right kind of culture, they have the right kind of curriculum. Just focus on those aspects. If those are solid, then eventually you'll get to a really good and high quality career. If those are not good and then you have some random degree, nobody in the world is going to care about that degree."),
            ("Naga Chadanya", 312, 326, "Yeah. Correct. So it's a lot more about how you build your profile around whatever place you are in. And I feel that is really more important rather than where you study or the kind of college you are in. Degree, basically."),
            ("Naga Chadanya", 326, 336, "So yeah, I think that is it for now. We'll now head to AI labs."),
            ("Naga Chadanya", 336, 347, "Yeah. So this is our office where we work from. And this is the cafeteria. With that being said, let's just take a seat."),
            ("Naga Chadanya", 347, 365, "Since we're at Scalar AI Labs right now, I'm also really excited to learn what you guys actually do in here, like being at the heart of SF. So if you guys can go into the deep technicals around what you are building and how you're doing it, that would be really helpful."),
            ("Anuman Singh", 365, 371, 'We are essentially the bridge between AI and the real work. And this applies to both coding and non-coding.'),
            ("Anuman Singh", 371, 389, "Which means within coding, let's say we would go into cyber security, or building out products from scratch, or improving products from scratch. We'll take a bunch of problems and we would figure out where the model does well versus where the model doesn't do well."),
            ("Anuman Singh", 389, 407, "Wherever the model doesn't do well, we typically prepare a plan of how to improve the model from that place to a better position, which is basically a combination of a lot of task rubrics, the right kind of environment, and then making an RL run happen on it. RL is basically reinforcement learning."),
            ("Anuman Singh", 407, 421, 'So we do a bunch of that. In non-coding space, we typically first prioritize verifiable domains. So what are verifiable domains? Domains where work you can objectively say is correct or not.'),
            ("Anuman Singh", 421, 434, 'So for example in finance, if I ask you to calculate profit of a company, you cannot have two different answers. There is one correct answer versus all the other answers. So finance is a verifiable domain.'),
            ("Anuman Singh", 434, 456, "Within finance as well we do a very similar thing, which is if you look at what an accountant does or what an FP&A person would do or what an MIS person would do, we would map out a lot of that work. We would see where the model today does a good job and where it doesn't. Wherever it doesn't, we create the right kind of environments, data, and the training pipeline on top of it."),
            ("Anuman Singh", 456, 465, 'So a lot of first principle research to figure out where to improve the model.'),
            ("Naga Chadanya", 465, 472, "Makes sense. So you're basically correcting the models and making them better by feeding in the right data and taking it in the right direction. That's pretty cool."),
            ("Naga Chadanya", 472, 489, 'So yeah, I think thanks guys for having us here and hearing us out. I think this was really helpful on planning out your college and what to do when you get to college as well. So, see you guys around. Bye-bye.'),
        ],
    },
]
