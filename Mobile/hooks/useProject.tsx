import { USER_ROLES } from "@/lib/constants";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

interface Project {
  _id: string;
  name?: string;
  description?: string;
}

type ProjectContextType = {
  project: Project | null;
  setProject: Dispatch<SetStateAction<Project | null>>;
  role: string;
  setRole: Dispatch<SetStateAction<string>>;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<Project | null>(null);
  const [role, setRole] = useState<string>(USER_ROLES.MEMBER);

  return (
    <ProjectContext.Provider value={{ project, setProject, role, setRole }}>
      {children}
    </ProjectContext.Provider>
  );
}

export default function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within ProjectProvider");
  }
  return context;
}
