import MainLogo from "../components/ui/MainLogo";
import Navigation from "../components/ui/Navigation";

const HomePage = () => {
  return (
    <div>
      <MainLogo />
        <p>This is the Home page.</p>
        <Navigation onSelectView={(view) => console.log(view)} />
    </div>
  );
};
export default HomePage;