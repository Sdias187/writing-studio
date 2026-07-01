from playwright.sync_api import sync_playwright
import sys

CHECK = "[OK]"
CROSS = "[FAIL]"

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        console_errors = []

        def on_console(msg):
            if msg.type == "error":
                console_errors.append(msg.text)

        page.on("console", on_console)

        page.goto("http://localhost:5173", wait_until="networkidle")
        page.wait_for_timeout(2000)

        print(f"Page title: {page.title()}")
        print(f"URL: {page.url}")

        if console_errors:
            print(f"\n{CROSS} Console errors ({len(console_errors)}):")
            for err in console_errors[:10]:
                print(f"  - {err}")
        else:
            print(f"\n{CHECK} No console errors")

        # Navigate to editor
        project_items = page.locator('div.grid.gap-3 > div[class*="rounded-xl"]')
        project_count = project_items.count()
        print(f"\nProjects found: {project_count}")

        if project_count > 0:
            project_items.first.click()
            print(f"{CHECK} Clicked existing project")
        else:
            # Click "Novo projeto" in the header
            page.get_by_role("button", name="Novo projeto").click()
            page.wait_for_timeout(300)

            # Fill project title
            title_input = page.locator('input[placeholder*="Título"]')
            if title_input.count() > 0:
                title_input.fill("Test Project")
                page.wait_for_timeout(200)

                # Click "Criar" to create and navigate to editor
                page.get_by_role("button", name="Criar").click()
                print(f"{CHECK} Created new project")
            else:
                print(f"{CROSS} Title input not found")

        page.wait_for_timeout(1500)

        # Check for the floating toolbar
        toolbar = page.locator('[role="toolbar"]')
        if toolbar.count() > 0:
            print(f"{CHECK} Floating toolbar found (role='toolbar')")
            print(f"  - Visible: {toolbar.is_visible()}")

            buttons = toolbar.locator('button')
            print(f"  - Buttons in toolbar: {buttons.count()}")

            bold_btn = toolbar.locator('[aria-label="Bold (Ctrl+B)"]')
            italic_btn = toolbar.locator('[aria-label="Italic (Ctrl+I)"]')
            h1_btn = toolbar.locator('[aria-label="Heading 1"]')
            more_btn = toolbar.locator('[aria-label="More formatting options"]')
            undo_btn = toolbar.locator('[aria-label*="Undo"]')
            list_btn = toolbar.locator('[aria-label="Bullet List"]')

            print(f"  - Bold button: {CHECK if bold_btn.count() > 0 else CROSS}")
            print(f"  - Italic button: {CHECK if italic_btn.count() > 0 else CROSS}")
            print(f"  - Heading 1 button: {CHECK if h1_btn.count() > 0 else CROSS}")
            print(f"  - More button: {CHECK if more_btn.count() > 0 else CROSS}")
            print(f"  - Undo button: {CHECK if undo_btn.count() > 0 else CROSS}")
            print(f"  - Bullet List button: {CHECK if list_btn.count() > 0 else CROSS}")

            # Test an interaction
            if bold_btn.count() > 0:
                editor_area = page.locator(".tiptap-editor")
                if editor_area.count() > 0:
                    editor_area.click()
                    page.wait_for_timeout(500)

                bold_btn.click()
                page.wait_for_timeout(300)

                editor_area = page.locator(".tiptap-editor")
                if editor_area.count() > 0:
                    editor_area.type("Hello Bold Text")
                    print(f"{CHECK} Clicked Bold and typed text")
        else:
            print(f"{CROSS} Floating toolbar NOT found!")

        # Screenshot
        screenshot_path = "/tmp/writing-studio-toolbar.png"
        page.screenshot(path=screenshot_path, full_page=True)
        print(f"\nScreenshot: {screenshot_path}")

        browser.close()

        success = len(console_errors) == 0 and toolbar.count() > 0
        print(f"\nResult: {'ALL CHECKS PASSED' if success else 'SOME CHECKS FAILED'}")
        return success

if __name__ == "__main__":
    result = verify()
    sys.exit(0 if result else 1)
