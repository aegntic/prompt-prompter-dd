# Prompt Scoring Guide

## Overview

The Prompt Prompter uses a sophisticated scoring algorithm to evaluate prompt quality based on **prompt engineering best practices**. The score reflects how well-formed and actionable your prompt is, not just whether the LLM can respond.

**Key Principle:** A vague prompt like "fix code" will score low (~5-10%) even if the LLM produces a coherent response, because the prompt itself lacks the necessary context and specificity for effective AI interaction.

---

## Scoring Components

The final accuracy score combines **Prompt Quality (90%)** and **Response Quality (10%)**:

```
Final Score = (Prompt Quality × 0.90) + (Response Quality × 0.10)
```

### Prompt Quality Breakdown

| Component | Weight | What It Measures |
|-----------|--------|------------------|
| **Specificity** | 40% | Technical terms, action verbs, domain-specific language |
| **Meaningful Length** | 25% | Word count **after filtering stopwords** (my, please, the, etc.) |
| **Context** | 15% | Code blocks, data examples, problem descriptions |
| **Clarity** | 10% | Penalizes vague words (fix, help, thing), rewards clear language |
| **Structure** | 10% | Punctuation, formatting, numbered lists |

**Maximum Score:** 98% (no prompt is perfect)

---

## Score Ranges & Examples

### 0-10%: Terrible Prompts

**Characteristics:** Impossibly vague, no context, no specificity

| Score | Prompt | Why It's Bad |
|-------|--------|--------------|
| 9.4% | `fix code` | Only 2 meaningful words, no technical terms, no context |
| 9.5% | `fix my code please` | "my" and "please" are stopwords - same as "fix code"! |
| 8.2% | `help me` | Completely vague, no action or domain specified |
| 7.8% | `do something` | No technical content whatsoever |

**What's Missing:** Everything. These prompts provide zero actionable information.

---

### 10-20%: Extremely Poor

**Characteristics:** Adds one technical word but still vague

| Score | Prompt | What's Improved | Still Missing |
|-------|--------|-----------------|---------------|
| 13.9% | `fix the Python code` | Specifies language (Python) | What code? What's wrong? What should it do? |
| 15.2% | `debug my function` | Specifies what (function) | Which function? What language? What's the bug? |
| 17.1% | `help with my API` | Technical term (API) | Which API? What issue? What technology? |

**Improvement Needed:** Add context about the problem and expected behavior.

---

### 20-40%: Poor

**Characteristics:** Multiple technical terms, some problem description

| Score | Prompt | Why It Scores Here |
|-------|--------|-------------------|
| 39.6% | `fix the bug in my Python function that calculates sums` | Has language (Python), type (function), action (calculates sums), but lacks error details |
| 32.4% | `my JavaScript API endpoint returns wrong status codes` | Technical terms present, problem stated vaguely |
| 28.7% | `debug this SQL query that doesn't work` | Vague problem ("doesn't work" could mean anything) |

**Why Not Higher:** No specific error description, no expected vs actual behavior, missing code/data context.

---

### 40-60%: Decent

**Characteristics:** Clear action, specific problem, some expected behavior

| Score | Prompt | Strengths |
|-------|--------|-----------|
| 52.3% | `Debug this Python function that should calculate the sum of numbers, but returns incorrect results when given negative values.` | ✅ Language specified<br>✅ Expected behavior<br>✅ Specific failure condition |
| 48.6% | `Review my FastAPI endpoint that should return 200 OK but gives 500 errors when email field is missing.` | ✅ Framework (FastAPI)<br>✅ Expected behavior (200)<br>✅ Actual behavior (500)<br>✅ Trigger condition |
| 55.1% | `Analyze this SQL query for performance issues. It should complete in under 1 second but currently takes 15 seconds on tables with 100K+ rows.` | ✅ Clear problem<br>✅ Performance metrics<br>✅ Context about data size |

**To Reach 60%+:** Add code examples, more technical specifics, or structured requirements list.

---

### 60-80%: Good

**Characteristics:** Detailed problem description, specific error conditions, clear requirements

| Score | Prompt | Why It's Good |
|-------|--------|---------------|
| 77.3% | `Analyze this Python function for potential bugs. The function should take a list of integers and return their sum, but it currently throws an IndexError on empty lists.` | ✅ Language (Python)<br>✅ Data type (list of integers)<br>✅ Expected behavior (return sum)<br>✅ **Specific error type** (IndexError)<br>✅ **Exact trigger** (empty lists) |
| 72.8% | `Debug my React component that should display user avatars. When the user object has a null profile_image field, it crashes with "Cannot read property 'url' of null". Expected: show default avatar instead.` | ✅ Framework (React)<br>✅ Component purpose<br>✅ Exact error message<br>✅ Trigger condition (null field)<br>✅ Expected fallback behavior |
| 68.4% | `Optimize this database query. Currently returns 10,000 rows in 3 seconds, but should filter to ~100 relevant rows in under 500ms. Uses PostgreSQL 14 with indexes on user_id and created_at columns.` | ✅ Performance baseline<br>✅ Target metrics<br>✅ Database version<br>✅ Index details |

**To Reach 80%+:** Add structured formatting (numbered lists), code examples, or step-by-step requirements.

---

### 80-98%: Excellent

**Characteristics:** Highly specific, structured, multiple requirements, constraints

| Score | Prompt | Excellence Factors |
|-------|--------|--------------------|
| 90.4% | `Review and debug this Python FastAPI endpoint:`<br>`1. The function should validate email format using regex`<br>`2. Hash passwords with bcrypt before storing`<br>`3. Return 201 on success, 400 on validation error`<br>`Currently it returns 500 when email contains '+' character. Provide step-by-step analysis.` | ✅ **Numbered requirements**<br>✅ Specific libraries (bcrypt, regex)<br>✅ HTTP status codes (201, 400, 500)<br>✅ Exact failure case (+  character)<br>✅ Requested output format (step-by-step) |
| 87.2% | `Refactor this TypeScript React component to fix the following issues:`<br>`- Memory leak: useEffect cleanup not removing event listeners`<br>`- Type safety: props interface doesn't match actual usage`<br>`- Performance: re-renders on every parent update (should use memo)`<br>`Maintain backward compatibility with existing API.` | ✅ Language + framework<br>✅ Bullet-point structure<br>✅ Specific issues with technical terms<br>✅ Performance constraint<br>✅ Compatibility requirement |
| 92.1% | ` ``python`<br>`def calculate_total(items):`<br>`return sum(item['price'] for item in items)`<br>` ``` `<br>`This function crashes when items is None or contains items without 'price' key.`<br>`Requirements:`<br>`- Add input validation`<br>`- Return 0.0 for invalid input instead of crashing`<br>`- Maintain float precision for currency calculations`<br>`- Add comprehensive docstring with examples` | ✅ **Actual code provided**<br>✅ Specific error conditions<br>✅ Numbered requirements<br>✅ Precision constraint<br>✅ Documentation requirement |

**Why 98% Cap:** No prompt can be absolutely perfect - there's always room for more context, edge cases, or constraints.

---

## What Makes a Prompt Score High?

### ✅ DO Include

1. **Programming Language/Framework:** "Python", "React", "FastAPI", "PostgreSQL"
2. **Specific Component:** "function `calculate_total`", "API endpoint `/users/register`"
3. **Expected Behavior:** "should return 201 and user ID", "must complete in <500ms"
4. **Actual Problem:** "throws TypeError", "returns 500", "hangs indefinitely"
5. **Trigger Conditions:** "when input is empty", "on tables with 100K+ rows"
6. **Code/Data Examples:** Inline code blocks, sample inputs, error messages
7. **Structure:** Numbered lists, bullet points, clear sections
8. **Constraints:** "without breaking API", "maintain backwards compatibility"

### ❌ DON'T Do

1. **Use Filler Words:** "my", "please", "thanks", "hello" - these are ignored
2. **Be Vague:** "fix code", "help me", "doesn't work", "has issues"
3. **Assume Context:** Don't say "this code" without showing the code
4. **Skip Error Details:** "throws an error" → which error? Stack trace?
5. **Omit Requirements:** What's the expected output? What should happen instead?

---

## Scoring Examples by Category

### Web Development

| Score | Prompt |
|-------|--------|
| 11% | `fix my website` |
| 24% | `my React app has an error in the login component` |
| 51% | `Debug my React login form - the submit button doesn't call the API when clicked` |
| 73% | `Fix this React form submission: onClick handler doesn't trigger API call. Expected: POST to /api/login with email/password. Actual: nothing happens, no console errors.` |
| 89% | `Debug React form submission issue:`<br>`- Component: LoginForm.tsx`<br>`- Bug: handleSubmit() doesn't fire on button click`<br>`- preventDefault() is called correctly`<br>`- Expected: POST /api/login with {email, password}`<br>`- Actual: No network request, no console errors`<br>`- React 18, TypeScript 5.2` |

### Data Processing

| Score | Prompt |
|-------|--------|
| 9% | `fix my query` |
| 28% | `my SQL query to get user data is returning duplicates` |
| 54% | `This PostgreSQL query returns duplicate users because of the JOIN with orders table. Need to get unique users only.` |
| 76% | `Optimize this PostgreSQL query that returns duplicate user rows:`<br>` ``sql`<br>`SELECT users.*, orders.total FROM users JOIN orders ON users.id = orders.user_id`<br>` ``` `<br>`Problem: Users with multiple orders appear multiple times. Need: One row per user with total order sum. Database has 50K users, 200K orders.` |
| 91% | ` ``sql`<br>`SELECT u.id, u.email, u.name, o.order_total`<br>`FROM users u`<br>`LEFT JOIN orders o ON u.id = o.user_id`<br>`WHERE u.created_at > '2024-01-01'`<br>` ``` `<br>`Issue: Returns multiple rows per user (one per order)`<br>`Required fix:`<br>`1. Return ONE row per user`<br>`2. Include SUM of all order_total values`<br>`3. Preserve LEFT JOIN behavior (include users with 0 orders)`<br>`4. Optimize for 50K users, 200K orders (currently 2.3s, target <500ms)`<br>`Database: PostgreSQL 14, indexes on user_id and created_at` |

### Error Debugging

| Score | Prompt |
|-------|--------|
| 8% | `error in code` |
| 19% | `getting TypeError in my Python script` |
| 44% | `Python function throws TypeError: 'NoneType' object is not iterable when processing empty datasets` |
| 71% | `Debug this Python function:`<br>` ``python`<br>`def process_data(records):`<br>`return [r['value'] for r in records]`<br>` ``` `<br>`Error: TypeError: 'NoneType' object is not iterable`<br>`Occurs when: records parameter is None or empty list`<br>`Expected: Return empty list [] instead of crashing` |
| 94% | ` ``python`<br>`def process_user_records(records: list[dict]) -> list[float]:`<br>`"""Extract values from user records"""`<br>`return [record['value'] for record in records]`<br>` ``` `<br>`Error Details:`<br>`- TypeError: 'NoneType' object is not iterable`<br>`- Occurs when records=None (API returns null on empty dataset)`<br>`- Stack trace line 47: list comprehension`<br>`Fix Requirements:`<br>`1. Handle None input → return []`<br>`2. Handle missing 'value' key → skip record`<br>`3. Handle non-numeric values → skip or raise ValueError?`<br>`4. Add type hints throughout`<br>`5. Add docstring with input/output examples`<br>`Python 3.11, must pass mypy strict mode` |

---

## Tips to Improve Your Score

### From 0-20% → 20-40%

**Add:** Programming language, component type, basic problem description

```
Before: "fix my code"
After:  "fix the bug in my Python function that calculates averages"
```

### From 20-40% → 40-60%

**Add:** Expected vs actual behavior, specific error types

```
Before: "fix the bug in my Python function that calculates averages"
After:  "Debug this Python function that should calculate the average of a list of numbers, but returns 0 when given negative values"
```

### From 40-60% → 60-80%

**Add:** Specific error messages, trigger conditions, more technical context

```
Before: "Debug this Python function that should calculate averages, but returns 0 for negatives"
After:  "Analyze this Python statistics function for bugs. It should calculate the mean of a list of floats (positive or negative), but currently returns 0.0 whenever the list contains any negative numbers. Expected: mean([-5, 10, 15]) = 6.67. Actual: 0.0"
```

### From 60-80% → 80-98%

**Add:** Code examples, structured requirements, constraints, step-by-step format

```
Before: "Analyze this function... Expected: mean([-5, 10, 15]) = 6.67. Actual: 0.0"
After:  " ``python
         def calculate_mean(values: list[float]) -> float:
             total = sum(v for v in values if v > 0)
             return total / len(values)
         ``` 
         Bug Report:
         1. Function ignores negative values (line 2: if v > 0)
         2. Expected: sum ALL values, divide by count
         3. Test case: mean([-5, 10, 15]) should return 6.67, currently returns 8.33
         4. Edge cases to handle:
            - Empty list should return 0.0 or raise ValueError?
            - NaN values should be skipped or propagated?
         Requirements:
         - Fix the filtering logic
         - Add comprehensive docstring
         - Include type hints
         - Add input validation for empty lists
         - Must pass pytest with 100% coverage"
```

---

## Common Mistakes

### ❌ Mistake 1: Adding Filler Words

```
Bad:  "hey, can you please help me fix my code? thanks!"
Good: "fix the bug in my Python function that processes user data"
Score: ~Same (filler words are filtered out)
```

### ❌ Mistake 2: Saying "This Code" Without Showing It

```
Bad:  "this code has a bug"
Good: "this FastAPI endpoint has a bug: ..." [include code]
Score: Bad=12%, Good=65%+
```

### ❌ Mistake 3: Vague Problem Descriptions

```
Bad:  "my function doesn't work"
Good: "my function throws IndexError on empty lists"
Score: Bad=18%, Good=45%+
```

### ❌ Mistake 4: No Expected Behavior

```
Bad:  "debug this Python function that processes data"
Good: "debug this function - should return sorted list, actually returns None"
Score: Bad=22%, Good=58%+
```

---

## Quick Reference

### Minimum for Each Score Range

| Range | Minimum Requirements |
|-------|---------------------|
| **10%+** | 1 technical term (Python, API, etc.) |
| **20%+** | 2+ technical terms + problem type |
| **40%+** | Specific component + expected behavior + error description |
| **60%+** | All of above + specific error type/message + trigger condition |
| **80%+** | All of above + code examples + structured format + constraints |

### Fastest Way to 80%+

1. **Start with code:**
   ` ``python
   def my_function():
       # your code
   ``` `

2. **Add structured requirements:**

   ```
   Bug: [specific error]
   Expected: [what should happen]
   Actual: [what happens]
   Requirements:
   1. [requirement 1]
   2. [requirement 2]
   ```

3. **Include technical constraints:**
   - Language version
   - Framework version  
   - Performance targets
   - Compatibility needs

---

## Testing Your Prompts

Use the Prompt Prompter to test your prompts and see real-time scoring with detailed breakdowns of each component.

**Remember:** The goal isn't to game the score, it's to write prompts that give AI the context it needs to help you effectively!
