from playwright.sync_api import sync_playwright
import sys

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    errors = []
    page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)

    page.goto("http://localhost:5173", wait_until="networkidle")
    page.wait_for_timeout(3000)

    print("=== Console ===")
    for e in errors:
        print(e)
    print(f"Errors: {len(errors)}")

    # Take screenshot right away (on dashboard)
    page.screenshot(path="/tmp/screenshot1.png")
    print("Screenshot1 saved")

    # Try to click Novo projeto
    btn = page.get_by_role("button", name="Novo projeto")
    if btn.count() > 0:
        btn.click()
        page.wait_for_timeout(300)
        page.screenshot(path="/tmp/screenshot2.png")
        print("Screenshot2 saved (after click)")

        # Fill input
        inp = page.locator('input[placeholder*="Titulo"]')
        if inp.count() > 0:
            inp.fill("Test")
            page.wait_for_timeout(200)

            # Click Criar
            criar = page.get_by_role("button", name="Criar")
            if criar.count() > 0:
                criar.click()
                page.wait_for_timeout(2000)
                page.screenshot(path="/tmp/screenshot3.png")
                print("Screenshot3 saved (after create)")

                # Check toolbar
                tb = page.locator('[role="toolbar"]')
                print(f"Toolbar count: {tb.count()}")
                if tb.count() > 0:
                    print(f"Toolbar visible: {tb.is_visible()}")
                    print(f"Buttons: {tb.locator('button').count()}")
                else:
                    # Try more generic
                    tb2 = page.locator('[class*="rounded-full"]')
                    print(f"Pill containers: {tb2.count()}")

    browser.close()
    sys.exit(0)
