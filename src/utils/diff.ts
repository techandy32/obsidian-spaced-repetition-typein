/**
 * Diff utility for comparing typed answers with correct answers
 * Uses a character-level diff algorithm based on Longest Common Subsequence (LCS)
 */

export enum DiffType {
    Equal = "equal",
    Insert = "insert", // Character is in correct answer but not in user's answer (missing)
    Delete = "delete", // Character is in user's answer but not in correct answer (extra)
}

export interface DiffSegment {
    type: DiffType;
    text: string;
}

/**
 * Computes the Longest Common Subsequence (LCS) between two strings
 */
function computeLCS(str1: string, str2: string): number[][] {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1)
        .fill(null)
        .map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    return dp;
}

/**
 * Computes a diff between the user's answer and the correct answer
 *
 * @param userAnswer - The answer typed by the user
 * @param correctAnswer - The correct answer
 * @param caseSensitive - Whether the comparison should be case-sensitive
 * @returns An array of DiffSegments describing the differences
 */
export function computeDiff(
    userAnswer: string,
    correctAnswer: string,
    caseSensitive: boolean = false,
): DiffSegment[] {
    // For comparison, we may normalize case
    const compareUser = caseSensitive ? userAnswer : userAnswer.toLowerCase();
    const compareCorrect = caseSensitive ? correctAnswer : correctAnswer.toLowerCase();

    // If they're equal, just return one equal segment
    if (compareUser === compareCorrect) {
        return [{ type: DiffType.Equal, text: correctAnswer }];
    }

    // Compute the LCS table using the comparison strings
    const dp = computeLCS(compareUser, compareCorrect);

    // Backtrack to generate diff segments
    // We use the original strings for output but the comparison strings for matching
    const result: DiffSegment[] = [];
    let i = userAnswer.length;
    let j = correctAnswer.length;

    const segments: { type: DiffType; char: string }[] = [];

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && compareUser[i - 1] === compareCorrect[j - 1]) {
            // Use the correct answer's character for consistent display
            segments.push({ type: DiffType.Equal, char: correctAnswer[j - 1] });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            segments.push({ type: DiffType.Insert, char: correctAnswer[j - 1] });
            j--;
        } else {
            segments.push({ type: DiffType.Delete, char: userAnswer[i - 1] });
            i--;
        }
    }

    segments.reverse();

    for (const seg of segments) {
        if (result.length > 0 && result[result.length - 1].type === seg.type) {
            result[result.length - 1].text += seg.char;
        } else {
            result.push({ type: seg.type, text: seg.char });
        }
    }

    return result;
}

/**
 * Checks if the user's answer is correct (exact match or case-insensitive match)
 */
export function isAnswerCorrect(
    userAnswer: string,
    correctAnswer: string,
    caseSensitive: boolean = false,
): boolean {
    if (caseSensitive) {
        return userAnswer.trim() === correctAnswer.trim();
    }
    return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
}

/**
 * Renders the diff as HTML for display
 */
export function renderDiffHtml(diff: DiffSegment[]): string {
    return diff
        .map((segment) => {
            const escapedText = escapeHtml(segment.text);
            switch (segment.type) {
                case DiffType.Equal:
                    return `<span class="sr-typein-correct">${escapedText}</span>`;
                case DiffType.Insert:
                    return `<span class="sr-typein-missing">${escapedText}</span>`;
                case DiffType.Delete:
                    return `<span class="sr-typein-incorrect">${escapedText}</span>`;
                default:
                    return escapedText;
            }
        })
        .join("");
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
