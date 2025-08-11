import MainLogo from "../../components/ui/MainLogo";
import Navigation from "../../components/ui/Navigation";

const HomePageAdmin = () => {
  return (
    <div>
      <MainLogo />
        <p>This is the Admin Home page.</p>
        <Navigation onSelectView={(view) => console.log(view)} />
    </div>
  );
};
export default HomePageAdmin;