/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import userEvent from "@testing-library/user-event"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import mockedStore from "../__mocks__/store.js"
import { ROUTES, ROUTES_PATH} from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js"
import Store from "../app/Store.js"

jest.mock("../app/store", () => mockedStore)

const setNewBill = () => {
  return new NewBill({
    document, 
    onNavigate,
    store: mockedStore, 
    localStorage: window.localStorage
  })
}

 // Define an user employee before every test
 beforeEach( () => {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  window.localStorage.setItem('user', JSON.stringify({
    type: 'Employee'
  }))
})

// init onNavigate
const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};


describe("Given I am connected as an employee", () => {

  describe("When I am on NewBill Page", () => {

    test("Then Message Icon in vertical layout should be highlighted", async () => {
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const windowIcon = screen.getByTestId('icon-mail')
      //to-do write expect expression
      expect(windowIcon.classList.contains('active-icon')).toBeTruthy()
  })

    test("Then newBill page should be display", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      //to-do write assertion
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()
    })

    // Display form
    test('Then a form should be display', () => {
      document.body.innerHTML = NewBillUI();
      const form = document.querySelector('form');
      expect(form.length).toEqual(9);
    });
  })

  describe("When I am on New Bill page and and I want to add a file", () => {

    beforeEach(() => {
      // init DOM
      document.body.innerHTML = NewBillUI();
    })

    test("Then it should import my file when extension is correct", async () => {

      // Create an NewBill instance
      const NewBillContainer = setNewBill()

      console.log(NewBillContainer);

      const handleChangeFile = jest.fn(NewBillContainer.handleChangeFile);
      const file = screen.getByTestId("file");
      file.addEventListener("change", handleChangeFile);
      fireEvent.change(file, {
        target: {
          files: [ new File(["Image"], "image", {type: 'image/png'})]
        }
      })

      expect(handleChangeFile).toHaveBeenCalled()
      expect(file.files.length).toEqual(1)
    })

    test("Then it should display an error when i import a wrong file", () => {
      // Create an NewBill instance
      const NewBillContainer = setNewBill()

      const handleChangeFile = jest.fn(NewBillContainer.handleChangeFile);
      const file = screen.getByTestId("file");
      file.addEventListener("change", handleChangeFile);
      fireEvent.change(file, {
        target: {
          files: [ new File(["PDF"], "pdf", {type: 'application/pdf'})]
        }
      })

      expect(handleChangeFile).toHaveBeenCalled()
      expect(screen.getByText("Merci de choisir un fichier de type: JPG, PNG ou JPEG")).toBeTruthy()
    })
  })

})


