import { APP_KEY, getToken, clearToken } from "./auth.js";

export const NOT_AUTHORIZED = "NOT_AUTHORIZED";

/**
 * Standard fetch wrapper that attaches Trello API key and member token
 */
async function trelloFetch(t, path, options = {}) {
  const token = await getToken(t);
  if (!token) {
    throw new Error(NOT_AUTHORIZED);
  }

  const separator = path.includes("?") ? "&" : "?";
  const url = `https://api.trello.com/1${path}${separator}key=${APP_KEY}&token=${token}`;

  const res = await fetch(url, options);

  if (res.status === 401 || res.status === 403) {
    await clearToken(t);
    throw new Error(NOT_AUTHORIZED);
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown API Error");
    throw new Error(`Trello API Error (${res.status}): ${errorText}`);
  }

  return res.json();
}

/**
 * Fetches authenticated member profile
 */
export async function getCurrentMember(t) {
  try {
    return await trelloFetch(t, "/members/me?fields=fullName,username,avatarUrl,initials");
  } catch (err) {
    if (err.message === NOT_AUTHORIZED) throw err;
    // Fallback info if offline or mock
    return {
      fullName: "Trello Member",
      username: "member",
      initials: "CL",
    };
  }
}

/**
 * Disconnects the current member
 */
export async function disconnectMember(t) {
  await clearToken(t);
}

/**
 * Fetches lists on the current board
 */
export async function getBoardLists(t) {
  let boardId = null;
  if (t && typeof t.board === "function") {
    try {
      const b = await t.board("id");
      boardId = b?.id;
    } catch (e) {}
  }
  if (!boardId && t && typeof t.getContext === "function") {
    const ctx = t.getContext();
    boardId = ctx?.board;
  }

  if (!boardId) {
    return [];
  }

  return trelloFetch(t, `/boards/${boardId}/lists?fields=id,name,pos,closed`);
}

/**
 * Fetches cards on the current board with due dates and list ids
 */
export async function getBoardCards(t) {
  let boardId = null;
  if (t && typeof t.board === "function") {
    try {
      const b = await t.board("id");
      boardId = b?.id;
    } catch (e) {}
  }
  if (!boardId && t && typeof t.getContext === "function") {
    const ctx = t.getContext();
    boardId = ctx?.board;
  }

  if (!boardId) {
    return [];
  }

  return trelloFetch(
    t,
    `/boards/${boardId}/cards?fields=id,name,idList,due,dueComplete,labels,badges`
  );
}
