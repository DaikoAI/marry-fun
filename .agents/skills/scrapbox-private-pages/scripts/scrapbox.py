"""
scrapbox.py
===========

This module provides helper functions for working with Cosense/Scrapbox
private projects.  It is intended to be used as part of the
`scrapbox-private-pages` skill.  See the `SKILL.md` file in the
parent directory for usage instructions.

The functions defined here wrap the internal REST‑style APIs exposed
by Scrapbox and hide the details of authentication and URL encoding.

**Important notes**

1. These functions require a valid `connect.sid` cookie when the target
   project is private.  You can retrieve the value of this cookie
   manually from your browser via the developer tools (Application
   → Cookies → `https://scrapbox.io` → `connect.sid`).  Do not commit
   the cookie to version control.
2. Cosense officially documents read‑only REST endpoints for listing
   pages and fetching their content【262805452486776†L8-L29】.  Page
   creation is not provided as a traditional REST API.  Instead the
   Scrapbox UI accepts a URL of the form
   ``/projectName/pageTitle?body=encodedBody`` to create a new page
   with the provided content【816266854850144†L52-L64】.  The
   ``create_page`` function below automates this by issuing a GET
   request to that URL with your session cookie attached.  It will
   succeed only when the cookie represents a logged‑in user.

The functions defined here are deliberately simple so that they can
serve as building blocks for higher‑level workflows.  They return
Python dictionaries rather than bespoke classes, making them easy to
serialize to JSON if necessary.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, Optional

import requests

logger = logging.getLogger(__name__)


def _build_base_headers(sid_cookie: Optional[str] = None) -> Dict[str, str]:
    """Return a headers dictionary with the cookie when provided.

    Args:
        sid_cookie: The value of the `connect.sid` cookie (decoded).  If
            supplied, the cookie is added to the request headers.  If
            None, no Cookie header is set – only public projects can be
            accessed in this case.

    Returns:
        A dictionary of HTTP headers.
    """
    headers: Dict[str, str] = {
        "User-Agent": "scrapbox-private-pages/1.0 (+https://scrapbox.io)"
    }
    if sid_cookie:
        # Note: The cookie name must be "connect.sid" exactly.  The
        # cookie value should not be URL‑encoded.
        headers["Cookie"] = f"connect.sid={sid_cookie}"
    return headers


def list_pages(
    project_name: str,
    sid_cookie: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> Dict[str, Any]:
    """Fetch a list of pages from a Scrapbox project.

    This function calls the documented REST endpoint
    ``/api/pages/:projectName``【262805452486776†L8-L29】.  For public
    projects a cookie is not required.  For private projects you must
    pass a valid `sid_cookie` obtained from your browser.

    Args:
        project_name: The name of the Scrapbox project to query.
        sid_cookie: Optional `connect.sid` cookie for authentication.
        skip: How many pages to skip (default 0).
        limit: How many pages to fetch (default 100).  The server
            defaults to 100 and may cap the value.

    Returns:
        The parsed JSON response from Scrapbox.  On success the
        top‑level keys include ``count`` and ``pages`` where
        ``pages`` is a list of page metadata dictionaries.
    """
    base_url = f"https://scrapbox.io/api/pages/{project_name}"
    params = {"skip": skip, "limit": limit}
    headers = _build_base_headers(sid_cookie)
    logger.debug("Fetching page list: %s with params %s", base_url, params)
    response = requests.get(base_url, params=params, headers=headers)
    response.raise_for_status()
    return response.json()


def get_page(
    project_name: str,
    page_title: str,
    sid_cookie: Optional[str] = None,
    include_text: bool = True,
) -> Dict[str, Any]:
    """Retrieve metadata and optionally the full text of a Scrapbox page.

    This function calls ``/api/pages/:projectName/:pageTitle``
    to fetch page metadata【262805452486776†L8-L29】.  If ``include_text``
    is True it also calls ``/api/pages/:projectName/:pageTitle/text``
    to fetch the page body and attaches it to the returned dictionary.

    Args:
        project_name: Name of the project.
        page_title: Title of the page to retrieve.  Spaces are allowed
            and will be URL‑encoded automatically.
        sid_cookie: Optional `connect.sid` cookie for authentication.
        include_text: Whether to fetch the page body as plain text.

    Returns:
        A dictionary with the keys ``meta`` containing metadata and
        optionally ``text`` containing the page body.  If the page is
        not found a ``requests.HTTPError`` is raised.
    """
    import urllib.parse as _urlparse

    encoded_title = _urlparse.quote(page_title)
    base_meta_url = f"https://scrapbox.io/api/pages/{project_name}/{encoded_title}"
    headers = _build_base_headers(sid_cookie)
    logger.debug("Fetching page metadata: %s", base_meta_url)
    meta_resp = requests.get(base_meta_url, headers=headers)
    meta_resp.raise_for_status()
    meta = meta_resp.json()
    result: Dict[str, Any] = {"meta": meta}
    if include_text:
        text_url = f"{base_meta_url}/text"
        logger.debug("Fetching page text: %s", text_url)
        text_resp = requests.get(text_url, headers=headers)
        text_resp.raise_for_status()
        result["text"] = text_resp.text
    return result


def create_page(
    project_name: str,
    title: str,
    body: str = "",
    sid_cookie: str | None = None,
) -> Dict[str, Any]:
    """Create a new page in a Scrapbox project.

    Scrapbox does not expose a conventional REST endpoint for creating
    pages.  Instead, the web UI interprets a URL of the form
    ``/projectName/pageTitle?body=encodedBody``【816266854850144†L52-L64】
    and creates the page automatically.  This helper function
    programmatically calls that URL.  For private projects you must
    provide a valid ``sid_cookie``.

    The body text can include newlines (``\n``) and should be plain
    Scrapbox markup.  The helper function will URL‑encode the title and
    body.  If the page already exists the body will be appended to the
    existing page【816266854850144†L54-L58】.

    Args:
        project_name: Target project name.
        title: Title of the new page.  It may contain spaces and
            punctuation.
        body: Optional body text (Scrapbox markup).  Defaults to empty.
        sid_cookie: `connect.sid` cookie for authentication; required
            when creating pages in private projects.

    Returns:
        A dictionary containing the URL used and the HTTP status
        returned.  On success, Scrapbox typically responds with a 200
        and returns HTML content.  The caller may ignore the body,
        since the page creation side effect is what matters.

    Warning:
        This method relies on undocumented behaviour.  Cosense/Scrapbox
        may change the mechanism without notice.  For more robust
        integration consider running the open‑source ``scrapbox-
        cosense-mcp`` server which exposes tool functions such as
        ``create_page`` via WebSockets【334427009481422†L684-L690】.
    """
    import urllib.parse as _urlparse

    if not sid_cookie:
        raise ValueError(
            "A valid connect.sid cookie is required to create pages in "
            "private projects.  Obtain the cookie from your browser's "
            "developer tools."
        )

    encoded_title = _urlparse.quote(title)
    encoded_body = _urlparse.quote(body)
    url = f"https://scrapbox.io/{project_name}/{encoded_title}?body={encoded_body}"
    headers = _build_base_headers(sid_cookie)
    logger.debug("Creating page via GET %s", url)
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    return {"url": url, "status": resp.status_code}


def main() -> None:
    """Small command line utility for manual testing.

    You can run this module as a script to list pages or create a new
    page.  It reads the `SCRAPBOX_PROJECT`, `SCRAPBOX_TITLE`,
    `SCRAPBOX_BODY`, and `SCRAPBOX_SID` environment variables.  If
    ``SCRAPBOX_TITLE`` is provided it will create a new page; otherwise
    it will list the first 10 pages of the project.
    """
    project = os.environ.get("SCRAPBOX_PROJECT")
    title = os.environ.get("SCRAPBOX_TITLE")
    body = os.environ.get("SCRAPBOX_BODY", "")
    sid = os.environ.get("SCRAPBOX_SID")
    if not project:
        raise SystemExit("Please set SCRAPBOX_PROJECT to the target project name.")
    if title:
        result = create_page(project, title, body, sid_cookie=sid)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        pages = list_pages(project, sid_cookie=sid, limit=10)
        print(json.dumps(pages, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()