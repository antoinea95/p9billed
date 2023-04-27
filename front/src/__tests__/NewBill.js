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
import BillsUI from "../views/BillsUI.js"

jest.mock("../app/store", () => mockedStore)

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

const setNewBill = () => {
  return new NewBill({
    document, 
    onNavigate,
    store: mockedStore, 
    localStorage: window.localStorage
  })
}


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

      // Mocked function
      const handleChangeFile = jest.fn(NewBillContainer.handleChangeFile);
      const createFile = await mockedStore.bills().create()


      const file = screen.getByTestId("file");
      file.addEventListener("change", handleChangeFile);
      fireEvent.change(file, {
        target: {
          files: [ new File(["Image"], "image", {type: 'image/png'})]
        }
      })

      expect(handleChangeFile).toHaveBeenCalled()
      expect(file.files.length).toEqual(1)
      expect(createFile).toStrictEqual({"fileUrl": "https://localhost:3456/images/test.jpg", "key": "1234"})
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

//Test post request 
describe('Given I am a user employee', () => {

  describe('When i submit a form', () => {

    beforeEach(() => {
      document.body.innerHTML = NewBillUI();
    })

    test('Then it should generate a new bill if it valid', async () => {

      // Set localstorage with a user mail
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));


      // Create a new bill instance
      const NewBillContainer = setNewBill();

      // Create a bill to filled form
      const bill =
        {
          id: "47qAXb6fIm2zOKkLzMro",
          vat: "80",
          type: "Hôtel et logement",
          commentary: "séminaire billed",
          name: "encore",
          date: "2004-04-04",
          amount: 400,
          pct: 20,
          file: new File(['test'], 'test.png', { type: 'image/png' }),
        }

        // filled all input in form
        const formNewBill = screen.getByTestId("form-new-bill");
        const type = screen.getByTestId("expense-type");
        const name = screen.getByTestId("expense-name");
        const amount = screen.getByTestId("amount");
        const date = screen.getByTestId("datepicker");
        const vat = screen.getByTestId("vat");
        const pct = screen.getByTestId("pct");
        const commentary = screen.getByTestId("commentary");
        const file = screen.getByTestId("file");

        fireEvent.change(type, {
          target: {value: bill.type}
        })

        fireEvent.change(name, {
          target: {value: bill.name}
        })

        fireEvent.change(amount, {
          target: {value: bill.amount}
        })

        fireEvent.change(vat, {
          target: {value: bill.vat}
        })

        fireEvent.change(pct, {
          target: {value: bill.pct}
        })

        fireEvent.change(commentary, {
          target: {value: bill.commentary}
        })

        userEvent.upload(file, bill.file)
      

      // mocked handlesubmit function
      const mockedHandleSubmit = jest.fn((e) => NewBillContainer.handleSubmit(e));
      const mockedOnNavigate = jest.spyOn(NewBillContainer, "onNavigate");

      // add event listener submit
      formNewBill.addEventListener("submit", mockedHandleSubmit)
      fireEvent.submit(formNewBill);

      expect(mockedHandleSubmit).toHaveBeenCalled();
      expect(mockedOnNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills']);
    })

    test("Then it should return an error 404", async () => {

      mockedStore.bills(() => {
        return {
          update : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})

        const html = BillsUI({ error: "Erreur 404" });
        document.body.innerHTML = html;
        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
    })

    test("Then it should return an error 500", async () => {

      mockedStore.bills(() => {
        return {
          update : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})

      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const message = screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    })
  })

})


