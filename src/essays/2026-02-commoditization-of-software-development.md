---
title: The commoditization of software development
date: 2026-02-03
---

# The commoditization of software development

As a kid I liked watching Star Trek The Next Generation, and besides the usual science fiction things that attracted young me, the way they talked to and programmed computers was always fascinating. Everyone on that ship was programming all the time: engineers, doctors, Picard ordering tea, Geordi spinning up a holodeck program by describing the scenario, the kids in the school running simulations for class. Maybe that is even what got me fascinated with computers and software in the first place. Little did young me know that this was science fiction back then, but maybe not today anymore.

It first occurred to me a few weeks ago, watching my wife in her home office build an internal tool she needed in ninety minutes with no engineer in the loop. It was not perfect, it had issues, and vibe coding rightfully gets a lot of scrutiny for exactly that, but it did not matter, because she had built the thing herself in an afternoon instead of waiting days or weeks for a developer to free up. For most of the last thirty years, knowing what a piece of software should do but not knowing how to build it meant you filed a ticket and waited.

It made me think further, not only about whether we have reached TNG-level software development, but whether we are going into a commoditization of software. A commodity, in the economic sense, is something many producers supply in a form undifferentiated enough that buyers pick mostly on price. When a skill commoditizes the same dynamic plays out on the labor side: the ability to produce the thing spreads from a small group of professionals to a much larger pool, the price for the routine version drops sharply, and the professional tier survives by moving upmarket toward the work that the larger pool cannot do. Driving was a paid profession a hundred years ago and is now a baseline competency most adults pick up in their teens, with a smaller and better-paid market for the truckers and chauffeurs sitting on top. Photography went from chemistry and darkrooms to something a twelve-year-old does on the bus, while wedding and editorial photographers still get paid well for the work that needs them. Software development might be in the early stages of the same shift.

Building software needed two competencies that usually did not live in the same person: the ability to specify what a piece of software should do, and the ability to write the code that does it. The first sat with the product manager or the domain expert, the second with the engineers (SWE, SRE, data, platform) who had spent years getting good at a specific stack and what tends to break in it. The "10x developer" trope, when it pointed at anything real, pointed at the rare person who held all of these at once. A lot of people have good ideas but most lack the skills to build them, and coding agents are starting to close that gap. If you can specify what you want with enough precision, an agent will produce working code, not on the first try and not without supervision, but often enough that the binding constraint has moved from "can I build it" to "can I describe it precisely." That sounds like a small change until you watch someone who has never opened an IDE argue with an agent about a broken button, paste in the error message, reject the first fix, and end up with a working tool before lunch.

What this shift looks like once a company actually runs on it is starting to come out of the places closest to the agents themselves. Anthropic showcases the same pattern in its own engineering: the [majority of code is now written by Claude Code](https://www.anthropic.com/product/claude-code), engineers spend more of their time on architecture, product thinking, and orchestrating multiple agents in parallel, and the [Claude Code codebase itself is around 90% self-written](https://newsletter.pragmaticengineer.com/p/how-claude-code-is-built).

Its customer examples point in the same direction: Stripe migrated [10,000 lines of Scala to Java in four days](https://www.anthropic.com/product/claude-code) against a ten-engineer-week estimate, and Wiz moved a [50,000-line Python library to Go in roughly 20 hours](https://www.anthropic.com/product/claude-code) of active development against a two-to-three-month estimate. Inside Anthropic, the legal team builds its own internal tools, and the [finance team queries the data warehouse in plain English](https://www.anthropic.com/product/claude-code) instead of writing SQL. The lawyers and the marketers are not learning Python. They are specifying what they need and getting it back.

Construction work runs in three tiers: the DIY homeowner who hangs the shelves and fixes the running toilet, the general contractor who handles a kitchen renovation end to end, and the structural engineer who gets called in when walls come down or for the commercial buildings where things can really go wrong. In software the equivalent has not really existed, because until recently there was no other way to get the shelves hung than to call a contractor, and what my wife did in her home office is the DIY tier becoming possible for the first time.

The interesting person in this world is not the nontechnical PM who suddenly becomes an engineer, and not the engineer who grudgingly writes product specs. It is the merged PM/SE: one person carrying the full specification of a system and using agents to produce most of the implementation, owning the whole thing from what the system should do down to what happens when it breaks at three in the morning. [Boris Cherny, who leads Claude Code, built around twenty prototypes of the todo lists feature in a few hours over two days](https://newsletter.pragmaticengineer.com/p/how-claude-code-is-built), and twenty prototyping passes in two days is not how a PM and an engineer work together, it is how one person works with an agent.

Compiler internals, kernel scheduling, anything that needs code the model has not seen patterns of, still needs people who can hold the implementation in their head. Those people will be paid more, for the same reason structural engineers cost more than handymen.

The uncomfortable part is that this does not attack the hardest version of software engineering first. It attacks the routine version, which is where most of the labor market actually lives.

A specification used to be an English document handed to engineers who then negotiated with it for two weeks. Now it looks more like:

```markdown
# Spec: webhook deduplication service

## Behavior
- Accept POST /events with JSON {id: string, timestamp: int, body: object}
- Reject if id seen in last 24h: return HTTP 200 with {status: "duplicate"}
- Otherwise persist and return {status: "accepted"}
- Persistence: Postgres, table `events`, primary key on `id`
- Concurrency: two simultaneous requests with the same id must result
  in exactly one persisted row

## When things go wrong
- DB unreachable: return 503, do not enqueue retry
- Malformed payload: return 400 with field-level error
- Clock skew: trust the caller's timestamp

## Tests
- Duplicate inside the 24h window
- Concurrent insert race
- Connection drop mid-write
```

The agent of your preference writes the implementation and the tests, the person reviews the choice of unique constraint versus advisory lock, runs the tests, and ships it.

None of this is perfect yet, as LLMs still hallucinate, drift across long contexts, and produce subtly wrong concurrency code, and anyone using these tools daily has a folder of stories. But look at where we started: ChatGPT shipped in November 2022, the first usable version of Claude Code shipped in early 2025, and the gap between "interesting demo that breaks on real codebases" and "wrote 90% of its own source" was about thirty months. What is left is engineering work the field knows how to do.

The closest analogue is the web around 1996. The protocols worked, the browsers were terrible, and the security model was a joke. Newspaper editors spent the next decade arguing about whether the web was a real medium or a passing distraction, with the print desk treated as the senior operation and the web desk as something between an experiment and a junior partner. Their argument was not stupid, it was grounded in a hundred years of knowing what readers wanted, but they were also wrong about the only thing that mattered, which was where the next generation of readers would go. Pages like Craigslist quietly took the classifieds business that had funded local newsrooms for a century, the print ad market collapsed alongside it, and the publications that had defended the old format hardest were the ones that struggled most to survive the new one. The people who looked at Netscape 2.0 and said "this is a toy" were right about the artifact and wrong about the trajectory.

The argument over whether real engineers write code by hand will age about as well as the print-vs-digital arguments did. Software will look in twenty years much like driving and photography do today: a much larger pool of people building the routine stuff for themselves, and a smaller, better-paid professional tier doing the work that still needs them. Commoditization does not mean engineers disappear. It means everyone else arrives. The TNG writers in 1987 had the right idea. They just assumed it would take a starship and four hundred years to get there. It took a laptop and about thirty.
