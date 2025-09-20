
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './App.css'
import {BrowserRouter, Routes, Route} from "react-router";
import AssistantsPage from './dashboard/assistants/page.tsx';
import WorkspacePage from './dashboard/workspace/page.tsx';
import Register from './(auth)/auth/register/page.tsx';
import Login from './(auth)/auth/login/page.tsx';
import AccountSettingsPage from './dashboard/account/page.tsx';

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
<BrowserRouter>
               <Routes>
                   <Route path='/' element={<App />}></Route>
                    <Route path='/auth/register' element={ <Register />}></Route>
                    <Route path='/auth/login' element={<Login />}></Route>
                    <Route path='/dashboard/assistants' element={<AssistantsPage />}></Route>
                    <Route path='/dashboard/workspace' element={<WorkspacePage />}></Route>
                    <Route path='/dashboard/account' element={<AccountSettingsPage />}></Route>
               </Routes>
           </BrowserRouter>
  // </StrictMode>,
)
