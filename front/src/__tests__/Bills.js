/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import userEvent from "@testing-library/user-event";
import mockedStore from "../__mocks__/store.js"
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

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

  describe("Given I am connected as an employee", () => {

    describe("When I am on Bills Page", () => {

      test("Then bill icon in vertical layout should be highlighted", async () => {
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
        window.onNavigate(ROUTES_PATH.Bills)
        await waitFor(() => screen.getByTestId('icon-window'))
        const windowIcon = screen.getByTestId('icon-window')
        //to-do write expect expression
        expect(windowIcon.classList.contains('active-icon')).toBeTruthy()
      });

      test("Then bills should be ordered from earliest to latest", () => {
        document.body.innerHTML = BillsUI({ data: bills })
        const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
        const antiChrono = (a, b) => ((a < b) ? 1 : -1)
        const datesSorted = [...dates].sort(antiChrono)
        expect(dates).toEqual(datesSorted)
      });

    })


    describe('When I am on Bills page but it is loading', () => {

      test('Then, Loading page should be rendered', () => {
        document.body.innerHTML = BillsUI({ loading: true })
        expect(screen.getAllByText('Loading...')).toBeTruthy()
      });
    });
    
    describe('When I am on Bills page but back-end send an error message', () => {

      test('Then, Error page should be rendered', () => {
        document.body.innerHTML = BillsUI({ error: 'some error message' })
        expect(screen.getAllByText('Erreur')).toBeTruthy()
      });
    });

    // When user click on Eye icon
  describe("When I am on Bills page and user click on Eye icon", () => {

    test("Then it should display modal", () => {
      $.fn.modal = jest.fn();
      // display bills on scree
      document.body.innerHTML = BillsUI({data: bills})
      // Create an instance of bills container
      const BillsContainer = new Bills({
        document,
        onNavigate,
        store: mockedStore,
        localStorage: window.localStorage,
      });
      // get All icon eye
      const icon = screen.getAllByTestId('icon-eye')[0];
          const handleClickIconEye = jest.fn(BillsContainer.handleClickIconEye(icon))
          icon.addEventListener("click", handleClickIconEye)
          userEvent.click(icon)
          expect(handleClickIconEye).toHaveBeenCalled();
          expect($.fn.modal).toHaveBeenCalled();
          expect(screen.getByTestId("modal")).toBeTruthy();
          expect(screen.getByTestId("modal-title")).toBeTruthy();
      });
    });

  // When user click on Eye icon
  describe("When I am on Bills page and user click on new bill button", () => {

    test("Then it should redirect user on new bill page", () => {
      // display bills on screen
      document.body.innerHTML = BillsUI({ data: bills });
      // create a mock function for onNavigate
      const mockedOnNavigate = jest.fn(onNavigate);
      // create an instance of Bills container with the mocked function
      const BillsContainer = new Bills({
        document,
        onNavigate: mockedOnNavigate,
        store: mockedStore,
        localStorage: window.localStorage,
      });

      // simulate a button click
      const newBillButton = screen.getByTestId("btn-new-bill");
      const handleClickNewBill = jest.fn(BillsContainer.handleClickNewBill())
      newBillButton.addEventListener("click", handleClickNewBill())
      userEvent.click(newBillButton);

      // assert that handleClickNewBill calls onNavigate with the NewBill route path
      expect(handleClickNewBill).toHaveBeenCalled();
      expect(mockedOnNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill']);
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();

    });
  });
});

// Integration test for get bills
describe("Given I am a user connected as Employee", () => {
 
  describe("When I navigate to Bills", () => {
    
    test("Then it should fetch bills from mock API GET", async () => {

      const spyMock = jest.spyOn(mockedStore, 'bills');
      const bills = await mockedStore.bills().list()

      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      const tableRows  = screen.getByTestId("tbody").children
      expect(spyMock).toHaveBeenCalled()
      expect(tableRows.length).toEqual(bills.length)
    })
    
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockedStore, "bills")
        Object.defineProperty(
            window,
            'localStorage',
            { value: localStorageMock }
        )
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
          email: "a@a"
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })
      test("Then it should fetch bills from an API and fails with 404 message error", async () => {
  
        mockedStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 404"))
            }
          }})
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })
  
      test("Then it should fetch bills from an API and fails with 500 message error", async () => {
  
        mockedStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 500"))
            }
          }})
  
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })

  })
})

 
