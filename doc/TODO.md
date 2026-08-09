
- [x] 1. **[CRITICAL] “Strict superset / unchanged meaning” is not true as currently defined.**
   **Location:** `Language Specification → Conformance`, lines 110–111.
   You say every CommonMark document keeps the same meaning, and specifically that renaming `.md` → `.hmd` “cannot change what it means.” ([hyper-markdown.org][1])

   But HMD then scans sequences like `[[foo]]` and assigns them wikilink semantics. CommonMark treats that sequence as ordinary literal text. HMD also gives a leading `--- ... ---` block frontmatter semantics. So a perfectly valid CommonMark document can change meaning when interpreted as HMD. ([hyper-markdown.org][1])

   **Fix:** weaken the claim. Something like:

   > Every CommonMark document is syntactically valid HMD. HMD preserves CommonMark constructs, while assigning additional semantics to byte sequences that CommonMark otherwise treats as ordinary text.

   “Every `.md` is valid `.hmd`” is defensible. **“Same meaning” is not.**

- [x] 2. **[CRITICAL] “A bare name never reaches sideways” directly contradicts autodiscovery.**
   **Locations:**

   * `Namespaces → TL;DR`, line 80
   * `Namespaces → Resolving a bare name`, line 122
   * `Language Specification → Rules the algorithm must satisfy`, line 249
   * `Tutorial → How a name is found`, line 438

   All say variants of “never sideways.” ([hyper-markdown.org][2])

   But phase 3 explicitly searches the entire root and your own tutorial demonstrates `[[login]]` in `glossary/` resolving sideways to `specs/auth/login.hmd`. ([hyper-markdown.org][3])

   **Fix everywhere:** distinguish **spine resolution** from **complete bare-name resolution**:

   > The spine never searches sideways. If it finds nothing, autodiscovery may resolve a unique match elsewhere in the namespace.

- [x] 3. **[CRITICAL] The claimed wildcard-import stability property is false.**
   **Locations:**

   * `Namespaces → Imports`, line 150
   * `Language Specification → Rules the algorithm must satisfy`, line 248

   You say:

   > adding `import *` … can never change what an already-working link means. ([hyper-markdown.org][2])

   But according to your own precedence:
   `spine → wildcard imports → autodiscovery`. ([hyper-markdown.org][1])

   Example:

   ```text
   /a/foo.hmd
   /b/foo.hmd
   /source/card.hmd
   ```

   Suppose `[[foo]]` currently resolves uniquely by autodiscovery to `/a/foo.hmd`. Later:

   ```yaml
   import:
     - from /b import *
   ```

   Phase 2 now resolves `/b/foo.hmd` **before the sweep even happens**. The working link changed meaning.

   **Fix:** either remove the property, or change wildcard semantics. The safe claim is only:

   > A wildcard import cannot override a named import or a spine match.

   That property actually follows from your algorithm.

- [x] 4. **[HIGH] “The language never guesses” conflicts with wildcard-import precedence.
   **Locations:**

   * `Language Specification → Name resolution`, line 182: “It never guesses.”
   * `Diagnostics`, line 373: ambiguity is an error because the language “will not choose on the author's behalf.”
   * Yet `Rules…`, line 250 and `HMD016`, line 371 say that if two wildcard origins contain the same name, **the earlier declaration wins**, with only a warning. ([hyper-markdown.org][1])

   That is literally a deterministic tie-break.

   It may be a **perfectly good design**, but then stop claiming that all ambiguity is rejected.

   Better:

   > Autodiscovery ambiguity is an error. Explicitly ordered import paths use declaration order, with shadowing reported as HMD016.

- [x] 5. **[HIGH] The grammar currently allows `/` inside a `segment`.
   **Location:** `Language Specification → Grammar`, lines 137–147.

   You define:

   ```text
   absolute := "/" segment { "/" segment }
   bare     := segment { "/" segment }
   segment  := 1*( any character except reserved )
   reserved := "[" | "]" | "|" | "#" | "^" | newline
   ```

   `/` is **not reserved**, therefore `/` is legal inside `segment`, while simultaneously being your segment separator. ([hyper-markdown.org][1])

   This makes the grammar ambiguous/non-strict.

   **Fix:** exclude `/` from `segment`. Probably:

   ```text
   segment := 1*(any character except "/" / "[" / "]" / "|" / "#" / "^" / newline)
   ```

- [x] 6. **[HIGH] `heading_text` is used by the grammar but never actually defined there.**
   **Location:** `Language Specification → Grammar`, line 140.

   You have:

   ```text
   fragment := "#" heading_text | "#^" block_id
   ```

   but `heading_text` has no grammar production. Later prose explains how it is slugified, but not what bytes are legal in it. ([hyper-markdown.org][1])

   This matters especially because `#`, `|`, `]]`, newline, etc. interact with link termination.

   **Fix:** give `heading_text` an explicit grammar production.

- [x] 7. **[HIGH] The relative-path grammar looks malformed or at least highly ambiguous.**
   **Location:** `Language Specification → Grammar`, line 138.

   Current:

   ```text
   relative := ( "./" | "../" ) { segment | ".." } { "/" ( segment | ".." ) }
   ```

   ([hyper-markdown.org][1])

   The first repetition has no separators and can apparently concatenate arbitrary `segment`/`..` values. It is hard to tell what strings this is intended to accept.

   **Fix:** define a path component first, then build relative paths from components:

   ```text
   path_component := segment | ".."
   relative := "./" path_component { "/" path_component }
             | "../" path_component { "/" path_component }
   ```

   Adjust for whether bare `./` or `../` should itself be valid.

- [x] 8. **[HIGH] `block_id` grammar is suspiciously parenthesized.**
   **Location:** `Language Specification → Grammar`, line 144.

   Current:

   ```text
   block_id := ALPHA / DIGIT *63( ALPHA / DIGIT / "_" / "-" )
   ```

   ([hyper-markdown.org][1])

   Depending on the grammar notation, this can parse as:

   ```text
   ALPHA
   OR
   DIGIT followed by up to 63 chars
   ```

   rather than “first char alphanumeric, followed by up to 63 allowed chars.”

   **Fix:**

   ```text
   block_id := ( ALPHA / DIGIT ) *63( ALPHA / DIGIT / "_" / "-" )
   ```

- [x] 9. **[HIGH] “`page_ref` is a name, not a path” contradicts your own grammar and algorithm.**
   **Location:** `Language Specification → Name resolution`, line 182.

   `page_ref` is explicitly:

   ```text
   absolute | relative | bare
   ```

   and absolute/relative forms are paths. ([hyper-markdown.org][1])

   The useful distinction is not `page_ref = name`. It is:

   > A **bare page reference** is resolved as a name; explicit relative and absolute page references are resolved as paths.

   That is much more precise.

- [x] 10. **[HIGH] “The sweep is the strict phase” is nonsense as specification terminology.**
    **Locations:**

    * `Namespaces → TL;DR`, line 81
    * `Namespaces → Resolving a bare name`, line 123. ([hyper-markdown.org][2])

    “Strict” already means something else in the spec: strict mode promotes warnings for build outcome. ([hyper-markdown.org][1])

    Here you mean:

    > autodiscovery has no ranking rule; multiple matches are ambiguous.

    Say exactly that.

- [x] 11. **[HIGH] “Strict mode promotes warnings to errors but output never changes” is internally muddy.
    **Location:** `Language Specification → Diagnostics`, line 376.

    You say strict mode MUST “promote every warning to an error” but then MUST NOT change the diagnostics/output, only “how they are counted.” ([hyper-markdown.org][1])

    Those are different models:

    * diagnostic severity changes from warning → error; or
    * diagnostics remain warnings, but warnings cause a failing exit status.

    Pick one.

    I think you actually mean the second:

    > Strict mode MUST NOT alter diagnostics or their reported severity. It only treats warnings as failures when determining the command outcome.

- [x] 12. **[MEDIUM/HIGH] “A namespace is the whole world a link can reach” becomes false once cross-namespace links exist.**
    **Locations:**

    * `Namespaces → A namespace is a named tree`, line 93
    * Tutorial line 119 uses the same “whole world” language. ([hyper-markdown.org][2])

    HMD-0004 then introduces `namespace:path`, specifically to reach another tree. ([hyper-markdown.org][2])

    Since cross-namespace resolution is proposed rather than shipped, qualify the statement:

    > In HMD 0.1, the default namespace root bounds all wikilink resolution.

    That survives future evolution much better.

- [x] 13. **[MEDIUM/HIGH] “Nothing outside the namespace is addressable” is too absolute.**
    **Location:** `Language Specification → The namespace`, line 173. ([hyper-markdown.org][1])

    Ordinary Markdown links can address files or URLs outside it, and your public Namespaces page explicitly says that. ([hyper-markdown.org][2])

    What you mean is:

    > Nothing outside the namespace is addressable **by an HMD page reference in version 0.1**.

    Normative specifications really need that qualifier.

- [x] 14. **[MEDIUM] The namespace docs describe `/shared/tokens` as “crossing a module boundary,” but ordinary bare autodiscovery can cross that same boundary.**
    **Location:** `Features → Modules and namespaces`, line 76. ([hyper-markdown.org][4])

    It says explicit paths/imports cross a module boundary “on purpose,” implying bare references do not. But phase 3 does.

    Better distinction:

    > explicit paths/imports cross module boundaries **without global discovery** and therefore make the dependency explicit.

- [x] 15. **[MEDIUM] “A module is a resolution boundary” is not really true with autodiscovery enabled.**
    **Location:** `Namespaces → A module is a folder`, line 89. ([hyper-markdown.org][2])

    A boundary generally means something cannot cross it. Your resolver absolutely can cross it via phase 3.

    I would call it:

    > A module is a **local resolution scope**.

    That describes what the spine actually does.

- [x] 16. **[MEDIUM] “Folder note makes a directory a module” contradicts the earlier definition that every directory is already a module.**
    **Locations:**

    * Language spec line 179: every directory inside the namespace is a module. ([hyper-markdown.org][1])
    * `use` section line 285: inheritance is “what makes a directory a module rather than a naming convention.” ([hyper-markdown.org][1])
    * Tutorial repeats this at line 492. ([hyper-markdown.org][3])

    The latter sentence is rhetoric, not logically correct.

    Delete it. A directory is a module by definition; `index.hmd` merely provides module-level inherited configuration.

- [x] 17. **[MEDIUM] Configuration prose says readers never need to know which resolution strategy a card uses — but cards can disable autodiscovery individually.**
    **Location:** `Language Specification → Frontmatter`, line 264. ([hyper-markdown.org][1])

    It says:

    > “a reader never has to ask which search strategy a given card used”

    Yet immediately afterward `use: [no_autodiscovery]` changes whether phase 3 exists for that card. ([hyper-markdown.org][1])

    That's precisely a per-card resolution difference.

    Better:

    > The ordering of resolution phases is uniform; a card may disable the final autodiscovery phase.

- [x] 18. **[MEDIUM] “mode MUST NOT be settable per card because different algorithms are unreadable” conflicts rhetorically with per-card autodiscovery toggling.**
    **Location:** `Project configuration`, lines 330–332. ([hyper-markdown.org][1])

    Your underlying distinction is sensible:

    * cards may disable a phase;
    * cards may not redefine how an enabled phase searches.

    Say that. Currently the justification overclaims.

- [x] 19. **[MEDIUM] Folder-note collision semantics are awkward: “card wins” while simultaneously being an error.**
    **Location:** `Binding a name in one directory`, line 199. ([hyper-markdown.org][1])

    If HMD012 is an error, why must resolution choose the card at all? Perhaps rendering/lint still requires deterministic continuation, which is legitimate—but specify that:

    > For deterministic diagnostics/rendering after HMD012, implementations MUST select the file card.

    Otherwise “wins” sounds like the collision is accepted.

- [x] 20. **[MEDIUM] The public docs repeatedly claim “ambiguity is an error,” which is too broad.**
    **Locations:** homepage, Introduction, Features, Tutorial, Namespaces. For example Introduction says “ambiguity is an error rather than a guess.” ([hyper-markdown.org][5])

    HMD016 proves that some ambiguity is explicitly resolved by declaration order and only warned. ([hyper-markdown.org][1])

    Use the more accurate:

    > Ambiguous autodiscovery is an error; explicit ordered imports use declaration precedence.

- [x] 21. **[MEDIUM] `[[glossary]]` being called a “name” versus `[[specs/auth]]` being treated as a path is conceptually unstable.**
    **Locations:** folder notes + resolver. ([hyper-markdown.org][3])

    Your grammar allows multi-segment `bare`:

    ```text
    bare := segment { "/" segment }
    ```

    So `specs/auth` is technically a **bare reference containing multiple segments**, not an absolute/relative path according to the grammar. Yet your explanatory docs naturally call slash-containing forms paths.

    I think the model would be cleaner if:

    * `name` = exactly one segment,
    * `path` = two or more segments or explicit `./`, `../`, `/`,
    * resolution algorithm says whether an unprefixed path participates in spine lookup.

    Right now terminology is fighting the grammar.

- [x] 22. **[STYLE, but worth fixing] Delete “Four words” entirely.**
    **Location:** `Namespaces → Four words: module, namespace, path, URL`, lines 84–112. ([hyper-markdown.org][2])

    The reviewer is right. Worse, because your distinction between **name/path/page_ref** isn't actually stable yet, this section confidently teaches terminology that the normative spec itself muddies.

- [x] 23. **[STYLE] Remove phrases like “the strict phase”, “whole world”, “the point”, “deliberate”, “what makes it a language”.**
    They aren't merely AI-ish: several of them currently conceal imprecision. The most obvious examples occur in Namespaces, Introduction and Tutorial. ([hyper-markdown.org][2])

- [x] 24. **The order I would fix this in is:**
    **(1)** strict-superset claim → **(2)** bare-name/spine/autodiscovery terminology → **(3)** wildcard stability claim → **(4)** ambiguity policy → **(5)** grammar (`segment`, relative, `heading_text`, `block_id`) → **(6)** strict-mode semantics → **(7)** module/namespace wording → **(8)** stylistic copy pass.

The biggest design question exposed by this audit is actually **#3**. Your current wildcard-import ordering does **not** give you the monotonicity property you're advertising. You need either to drop that promise or alter resolution semantics. Everything else is mostly clarification/correction; that one is a genuine resolver-design choice.

[1]: https://hyper-markdown.org/wiki/hmd-lang-spec/ "Language Specification - hyper-markdown"
[2]: https://hyper-markdown.org/public/namespaces/ "Namespaces - hyper-markdown"
[3]: https://hyper-markdown.org/wiki/hmd-tutorial/ "Tutorial - hyper-markdown"
[4]: https://hyper-markdown.org/public/features/ "Features - hyper-markdown"
[5]: https://hyper-markdown.org/public/introduction/ "Introduction - hyper-markdown"
