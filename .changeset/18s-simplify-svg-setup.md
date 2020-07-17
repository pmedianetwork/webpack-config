---
issue: Simplify SVG setup for js/ts #18
type: major
---

Now the default SVG setup will emit

```javascript
import starUrl, { ReactComponent as Star } from "./star.svg";
```

instead of

```javascript
import Star from "./star.svg";
```

as that's a better option here.
