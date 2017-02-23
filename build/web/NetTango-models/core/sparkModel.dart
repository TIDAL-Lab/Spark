/*
* Spark: Agent-based electrical circuit environment
* Copyright (c) 2013 Elham Beheshti
*
*       Elham Beheshti (beheshti@u.northwestern.edu)
*       Northwestern University, Evanston, IL
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License (version 2) as
* published by the Free Software Foundation.
*
* This program is distributed in the hope that it will be useful, but
* WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
* General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program; if not, write to the Free Software
* Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
*/
part of Spark;
/**
 * SparkModel extends the Model class in NetTango 
 * which specifies properties for the electrical conduction model
 */
abstract class SparkModel extends Model { 
  
  num initE; // initial energy of the ions
  num decE; // Ions' energies are decreased by decE at each tick
  num incE; // Ions' energies are indreaces by incE after each collision
  
  num voltage; // the force on electrons that moves them in an electric field
  var diameter;
  
  List<Ion> ions;
  List<Electron> electrons;
  List<Patch> conductors;
  
  
  SparkModel(String name, String id) : super(name, id) {
    ions = new List<Ion>();
    electrons = new List<Electron>();
    
    conductors = new List<Patch>();
  }
  
  /** setup the model
   */  
  void setup() {
    clearTurtles();
    initPatches();
    setupPatches();
    sproutIons();
  }
  
  void sproutIons();
  void setupPatches();
  
  /** setup the conductor patches
   @param int px the x coordinate of a patch
   @param int py the y coordinate of a path
   @param num heading the direction of the force exerted by voltage 
   @param String r the region where the patch is located (i.e., top, up, bottom, or down)
   @return void
   */    
  void setupConductorPatch(int px, int py, num heading, String r) { 
    heading = heading * PI / 180.0 ;
    Patch patch = patchAt(px, py);
    conductors.add(patch);
    patch.fieldDirection = heading;
    patch.region = r;
    patch.forceX = this.voltage * cos ( heading + PI / 2 );
    patch.forceY = this.voltage * sin ( heading + PI / 2 );
    patch.color.setColor(212, 212, 212, 50);
    
    // sprout electrons 
    for (int i=0; i < 2; i++) {
      if (Model.rnd.nextDouble() > 0.7) {
        sproutElectron(px, py);
      }
    }    
  }
  
  /** create electrons on conductor patches
   @param int patchX the X coordinate of the patch
   @param int patchY the Y coordinate of the patch
   @return void 
   */    
  void sproutElectron(int patchX, int patchY) {
      Electron electron = new Electron(this);
      electron.setXY(
          patchX + Model.rnd.nextDouble() - 0.5,
          patchY + Model.rnd.nextDouble() - 0.5);
      electron.setHeading(Model.rnd.nextInt(360)); // a random initial heading, in radians
      electron.vx = initE * cos(electron.heading + PI/2);
      electron.vy = initE * sin(electron.heading + PI/2);
      addTurtle(electron);
      electrons.add(electron);
  }
  
  /** create ions on conductor patches
   @param int patchX the X coordinate of the patch
   @param int patchY the Y coordinate of the patch
   @return void 
   */    
  void sproutIon(int patchX, int patchY) {
    Ion ion = new Ion(this);
    ion.energy = 0.1;
    ion.setXY(patchX, patchY);
    addTurtle(ion);
    ions.add(ion);
  }
  
/*  
  List<Patch> shuffle(List<Patch> ps) {
    List<Patch> shuffled = new List<Patch>();
    shuffled.addAll(ps);
    var random = new Random();

    // Go through all elements.
    for (var i = ps.length - 1; i > 0; i--) {

      // Pick a pseudorandom number according to the list length
      var n = random.nextInt(ps.length);

      var temp = shuffled[i];
      shuffled[i] = shuffled[n];
      shuffled[n] = temp;
    }

    return shuffled;
  }
*/
}

